"""
CodeQuest Python harness. Loaded once into the Pyodide worker by pythonEngine.ts.

Python:
  cq_run(code, stdin_json, fixtures_json)   -> JSON   (the Run button)
  cq_grade(code, spec_json)                 -> JSON   (the Submit button)
SQL (real SQLite via CPython's sqlite3 module):
  cq_sql_run(sql, db_source_or_empty)       -> JSON   (Run for SQL challenges)
  cq_sql_grade(sql, spec_json)              -> JSON   (Submit for SQL challenges)
  cq_sandbox_run(sql, state_b64, setup_sql) -> JSON   (persistent free-play database)

The player's code runs in a fresh namespace each time, with its own `input`, captured stdout/stderr, and a
temporary working directory holding any fixture files/databases (deleted afterwards). Errors are trimmed
to the player's own code so beginners are not shown harness frames.
This file is trusted; the player's code is not (it is isolated by the Web Worker + WASM sandbox).
"""
import ast
import base64
import builtins
import contextlib
import copy
import json
import linecache
import os
import re
import shutil
import sqlite3
import sys
import tempfile
import traceback

FILENAME = "<your code>"
MAX_OUTPUT = 20000
SQL_MAX_ROWS_SHOWN = 200
SQL_MAX_ROWS_FETCH = 5000
SQL_PROGRESS_EVERY = 10000  # VM instructions between progress callbacks
SQL_MAX_CALLBACKS = 6000  # ~60M instructions per statement before we stop a runaway query


class OutputLimit(Exception):
    pass


class _Capture:
    def __init__(self):
        self.parts = []
        self.size = 0
        self.truncated = False

    def write(self, text):
        self.size += len(text)
        if self.size > MAX_OUTPUT:
            self.truncated = True
            raise OutputLimit("Your program printed too much output and was stopped. Is a loop running forever?")
        self.parts.append(text)
        return len(text)

    def flush(self):
        pass

    def value(self):
        return "".join(self.parts)


def _make_input(lines, out, echo):
    queue = list(lines)

    def fake_input(prompt=""):
        if echo:
            out.write(str(prompt))
        if not queue:
            raise EOFError(
                "The program called input() but there was no input left. "
                'Type the input into the "Program input" box, one line for each input() call.'
            )
        line = queue.pop(0)
        if echo:
            out.write(line + "\n")
        return line

    return fake_input


def _format_error(exc, code):
    """Traceback limited to the player's own code, in normal Python style."""
    if isinstance(exc, SyntaxError):
        exc.filename = FILENAME
        return "".join(traceback.format_exception_only(type(exc), exc)).rstrip(), exc.lineno
    linecache.cache[FILENAME] = (len(code), None, code.splitlines(True), FILENAME)
    frames = [f for f in traceback.extract_tb(exc.__traceback__) if f.filename == FILENAME]
    text = ""
    if frames:
        text = "Traceback (most recent call last):\n" + "".join(traceback.format_list(frames))
    text += "".join(traceback.format_exception_only(type(exc), exc))
    return text.rstrip(), (frames[-1].lineno if frames else None)


# ---------------------------------------------------------------- workspace (fixtures)


def _safe_relpath(path):
    norm = os.path.normpath(path)
    if os.path.isabs(norm) or norm.startswith(".."):
        raise ValueError("fixture path escapes the workspace: " + path)
    return norm


def _build_database(path, setup_sql):
    con = sqlite3.connect(path)
    try:
        con.executescript(setup_sql)
        con.commit()
    finally:
        con.close()


@contextlib.contextmanager
def _workspace(fixtures):
    """A temporary working directory containing the fixture files and SQLite databases."""
    fixtures = fixtures or {}
    root = tempfile.mkdtemp(prefix="cq_")
    old = os.getcwd()
    try:
        os.chdir(root)
        for path, content in (fixtures.get("files") or {}).items():
            rel = _safe_relpath(path)
            folder = os.path.dirname(rel)
            if folder:
                os.makedirs(folder, exist_ok=True)
            with open(rel, "w", encoding="utf-8", newline="") as fh:
                fh.write(content)
        sources = fixtures.get("sources") or {}
        for name in fixtures.get("databases") or []:
            _build_database(name + ".db", sources[name])
        yield root
    finally:
        os.chdir(old)
        shutil.rmtree(root, ignore_errors=True)


def _merge_fixtures(base, extra):
    """Challenge-level fixtures plus a check's own additions (check wins on file paths)."""
    base, extra = base or {}, extra or {}
    files = dict(base.get("files") or {})
    files.update(extra.get("files") or {})
    dbs = list(base.get("databases") or [])
    for d in extra.get("databases") or []:
        if d not in dbs:
            dbs.append(d)
    return {"files": files, "databases": dbs, "sources": base.get("sources") or extra.get("sources") or {}}


def _check_fixtures(spec, check):
    return _merge_fixtures(spec.get("fixtures"), {"files": check.get("files"), "databases": check.get("databases"), "sources": (spec.get("fixtures") or {}).get("sources")})


# ---------------------------------------------------------------- executing player code


def _execute(code, stdin, echo, compiled=None, fixtures=None, after=None):
    """
    Run the code inside a fresh workspace. `after(ns)` (optional) runs in the same workspace after the code
    finished without error, so it can read files the program wrote. Returns
    (namespace, stdout_capture, stderr_capture, error_text, error_line, after_result).
    """
    out = _Capture()
    err = _Capture()
    env_builtins = dict(vars(builtins))
    env_builtins["input"] = _make_input(stdin, out, echo)
    ns = {"__name__": "__main__", "__builtins__": env_builtins}
    error, line, after_result = "", None, None
    with _workspace(fixtures):
        try:
            if compiled is None:
                compiled = compile(code, FILENAME, "exec")
            old_out, old_err = sys.stdout, sys.stderr
            sys.stdout, sys.stderr = out, err
            try:
                exec(compiled, ns)
            finally:
                sys.stdout, sys.stderr = old_out, old_err
        except OutputLimit as e:
            error = str(e)
        except SystemExit:
            error = ""
        except BaseException as e:  # noqa: BLE001 - the player's code can raise anything
            error, line = _format_error(e, code)
        if not error and after is not None:
            after_result = after(ns)
    return ns, out, err, error, line, after_result


def cq_run(code, stdin_json, fixtures_json="{}"):
    ns, out, err, error, line, _ = _execute(code, json.loads(stdin_json), echo=True, fixtures=json.loads(fixtures_json))
    return json.dumps(
        {"ok": not error, "stdout": out.value() + err.value(), "error": error, "errorLine": line, "truncated": out.truncated}
    )


# ---------------------------------------------------------------- Python grading helpers


def _norm_lines(text):
    lines = [l.rstrip() for l in text.replace("\r\n", "\n").split("\n")]
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(lines)


def _equal(got, expect, approx):
    if isinstance(expect, bool):
        return got is expect
    if isinstance(expect, (int, float)):
        if isinstance(got, bool) or not isinstance(got, (int, float)):
            return False
        return abs(got - expect) <= approx if approx else got == expect
    if isinstance(expect, str):
        return isinstance(got, str) and got == expect
    if expect is None:
        return got is None
    if isinstance(expect, list):
        if not isinstance(got, (list, tuple)) or len(got) != len(expect):
            return False
        return all(_equal(g, e, approx) for g, e in zip(got, expect))
    if isinstance(expect, dict):
        if not isinstance(got, dict) or set(got.keys()) != set(expect.keys()):
            return False
        return all(_equal(got[k], expect[k], approx) for k in expect)
    return False


def _short(value):
    text = repr(value)
    return text if len(text) <= 200 else text[:197] + "..."


def _call_repr(fn, args):
    return fn + "(" + ", ".join(repr(a) for a in args) + ")"


def _crash_message(error):
    last = error.strip().splitlines()[-1] if error.strip() else "an error"
    return "Your program crashed before the check could finish: " + last


def _strip_sql(sql):
    """Remove comments and string literals so keyword tests cannot be fooled by text."""
    sql = re.sub(r"/\*.*?\*/", " ", sql, flags=re.S)
    sql = re.sub(r"--[^\n]*", " ", sql)
    sql = re.sub(r"'(?:[^']|'')*'", "''", sql)
    return sql


def _has_node(tree, node):
    if node.startswith("call:"):
        name = node[5:]
        return any(
            isinstance(n, ast.Call)
            and (
                (isinstance(n.func, ast.Name) and n.func.id == name)
                or (isinstance(n.func, ast.Attribute) and n.func.attr == name)
            )
            for n in ast.walk(tree)
        )
    if node.startswith("import:"):
        mod = node[7:]
        for n in ast.walk(tree):
            if isinstance(n, ast.Import) and any(a.name.split(".")[0] == mod for a in n.names):
                return True
            if isinstance(n, ast.ImportFrom) and (n.module or "").split(".")[0] == mod:
                return True
        return False
    return any(type(n).__name__ == node for n in ast.walk(tree))


def _check_constraints(tree, constraints, code, is_sql=False):
    results = []
    cleaned = _strip_sql(code) if is_sql else ""
    for c in constraints:
        node = c["node"]
        if node.startswith("sql:"):
            found = re.search(node[4:], cleaned, re.I) is not None
        elif is_sql:
            found = False
        else:
            found = _has_node(tree, node)
        passed = found if c["type"] == "requires" else not found
        results.append({"message": c["message"], "passed": passed})
    return results


# ---------------------------------------------------------------- Python checks


def _run_check(check, code, compiled, spec):
    visible = check.get("visible", True)
    outcome = {"name": check["name"], "passed": False, "visible": visible, "message": ""}
    kind = check["kind"]
    fail_msg = check.get("feedback", "")
    fixtures = _check_fixtures(spec, check)

    if kind == "output":
        ns, out, err, error, line, _ = _execute(code, check.get("stdin", []), echo=False, compiled=compiled, fixtures=fixtures)
        if error:
            outcome["message"] = _crash_message(error)
            return outcome
        got, want = _norm_lines(out.value()), _norm_lines(check["expect"])
        same = got.lower() == want.lower() if check.get("ignoreCase") else got == want
        outcome["passed"] = same
        if not same:
            outcome["message"] = fail_msg or "The program's output was not what was expected."
            if visible:
                outcome["expected"], outcome["actual"] = want, got
        return outcome

    if kind == "variable":
        ns, out, err, error, line, _ = _execute(code, [], echo=False, compiled=compiled, fixtures=fixtures)
        if error:
            outcome["message"] = _crash_message(error)
            return outcome
        name = check["variable"]
        if name not in ns:
            outcome["message"] = "The variable `%s` was never created." % name
            return outcome
        same = _equal(ns[name], check["expect"], check.get("approx"))
        outcome["passed"] = same
        if not same:
            outcome["message"] = fail_msg or "The variable `%s` does not hold the right value." % name
            if visible:
                outcome["expected"], outcome["actual"] = _short(check["expect"]), _short(ns[name])
        return outcome

    if kind == "call":
        ns, out, err, error, line, _ = _execute(code, check.get("stdin", []), echo=False, compiled=compiled, fixtures=fixtures)
        if error:
            outcome["message"] = _crash_message(error)
            return outcome
        fn = ns.get(check["fn"])
        if not callable(fn):
            outcome["message"] = "No function named `%s` was found. Did you define it with `def`?" % check["fn"]
            return outcome
        args = copy.deepcopy(check.get("args", []))
        cap = _Capture()
        old = sys.stdout
        sys.stdout = cap
        try:
            with _workspace(fixtures):
                result = fn(*args)
            crashed = None
        except BaseException as e:  # noqa: BLE001
            result, crashed = None, e
        finally:
            sys.stdout = old
        label = _call_repr(check["fn"], check.get("args", []))
        if crashed is not None:
            text, _ = _format_error(crashed, code)
            outcome["message"] = "Calling %s crashed: %s" % (label if visible else "your function", text.splitlines()[-1])
            return outcome
        ok = True
        if "expect" in check:
            ok = _equal(result, check["expect"], check.get("approx"))
            if not ok and result is None:
                fail_msg = fail_msg or (
                    "Your function returned None. Remember: `print` shows a value, `return` hands it back to the caller."
                )
        if ok and "expectStdout" in check:
            ok = _norm_lines(cap.value()) == _norm_lines(check["expectStdout"])
        outcome["passed"] = ok
        if not ok:
            outcome["message"] = fail_msg or "The function did not behave as expected."
            if visible:
                want = check.get("expect") if "expect" in check else check.get("expectStdout")
                got = result if "expect" in check else _norm_lines(cap.value())
                outcome["expected"] = "%s -> %s" % (label, _short(want))
                outcome["actual"] = "%s -> %s" % (label, _short(got))
        return outcome

    if kind == "file":
        path = _safe_relpath(check["path"])

        def read_file(ns):
            if not os.path.exists(path):
                return ("missing", None)
            with open(path, encoding="utf-8", newline="") as fh:
                return ("ok", fh.read())

        ns, out, err, error, line, res = _execute(code, check.get("stdin", []), echo=False, compiled=compiled, fixtures=fixtures, after=read_file)
        if error:
            outcome["message"] = _crash_message(error)
            return outcome
        status, text = res
        if status == "missing":
            outcome["message"] = "The program did not create the file `%s`." % check["path"]
            return outcome
        if check.get("json"):
            try:
                same = json.loads(text) == json.loads(check["expect"])
            except ValueError:
                outcome["message"] = "The file `%s` is not valid JSON." % check["path"]
                return outcome
        else:
            same = _norm_lines(text) == _norm_lines(check["expect"])
        outcome["passed"] = same
        if not same:
            outcome["message"] = fail_msg or "The file `%s` does not contain what was expected." % check["path"]
            if visible:
                outcome["expected"], outcome["actual"] = _norm_lines(check["expect"]), _norm_lines(text)
        return outcome

    if kind == "script":
        def run_script(ns):
            cap = _Capture()
            old = sys.stdout
            sys.stdout = cap
            try:
                exec(compile(check["code"], "<check>", "exec"), ns)
                return ("ok", "")
            except AssertionError as e:
                return ("assert", str(e))
            except BaseException as e:  # noqa: BLE001
                return ("crash", "%s: %s" % (type(e).__name__, e))
            finally:
                sys.stdout = old

        ns, out, err, error, line, res = _execute(code, check.get("stdin", []), echo=False, compiled=compiled, fixtures=fixtures, after=run_script)
        if error:
            outcome["message"] = _crash_message(error)
            return outcome
        status, detail = res
        if status == "ok":
            outcome["passed"] = True
        elif status == "assert":
            outcome["message"] = detail or fail_msg or "A behaviour check did not pass."
        else:
            outcome["message"] = "Your code raised an error while it was being tested: " + detail
        return outcome

    if kind == "tests":
        return _run_tests_check(check, code, compiled, outcome, fixtures)

    outcome["message"] = "Unknown check kind: " + kind
    return outcome


def _run_tests_check(check, code, compiled, outcome, fixtures):
    """The player writes test_* functions. They must pass on the correct code and catch every buggy version."""

    def suite(impl_code):
        holder = {}

        def collect(ns):
            try:
                exec(compile(impl_code, "<implementation>", "exec"), ns)  # overrides anything the player defined
            except BaseException as e:  # noqa: BLE001
                return ("impl-error", str(e))
            tests = sorted((k, v) for k, v in ns.items() if k.startswith("test_") and callable(v))
            failed = []
            cap = _Capture()
            old = sys.stdout
            sys.stdout = cap
            try:
                for name, fn in tests:
                    try:
                        fn()
                    except BaseException:  # noqa: BLE001 - any failure means "this test fails"
                        failed.append(name)
            finally:
                sys.stdout = old
            return ("ok", (len(tests), failed))

        ns, out, err, error, line, res = _execute(code, [], echo=False, compiled=compiled, fixtures=fixtures, after=collect)
        return error, res

    error, res = suite(check["correct"])
    if error:
        outcome["message"] = _crash_message(error)
        return outcome
    _, (count, failed) = res
    if count < check.get("minTests", 1):
        outcome["message"] = "Write at least %d test function%s whose name starts with `test_`." % (check.get("minTests", 1), "" if check.get("minTests", 1) == 1 else "s")
        return outcome
    if failed:
        outcome["message"] = "Your tests must pass on correct code, but %s failed on a correct implementation. A test that fails on correct code is itself wrong." % ", ".join(failed)
        return outcome
    survivors = []
    for i, bug in enumerate(check["buggy"]):
        error, res = suite(bug["code"])
        _, (bcount, bfailed) = res if res else (None, (0, []))
        if error or not bfailed:
            survivors.append(bug["name"] if outcome["visible"] else "hidden bug %d" % (i + 1))
    if survivors:
        outcome["message"] = "Your tests passed on %d buggy version%s, so they missed: %s. Think about which inputs would expose it." % (len(survivors), "" if len(survivors) == 1 else "s", "; ".join(survivors))
        return outcome
    outcome["passed"] = True
    return outcome


def cq_grade(code, spec_json):
    spec = json.loads(spec_json)
    result = {"passed": False, "error": "", "errorLine": None, "checks": [], "constraints": []}
    try:
        tree = ast.parse(code, FILENAME)
        compiled = compile(tree, FILENAME, "exec")
    except SyntaxError as e:
        text, line = _format_error(e, code)
        result["error"], result["errorLine"] = text, line
        return json.dumps(result)

    result["constraints"] = _check_constraints(tree, spec.get("constraints", []), code)
    result["checks"] = [_run_check(c, code, compiled, spec) for c in spec["checks"]]
    result["passed"] = all(c["passed"] for c in result["checks"]) and all(c["passed"] for c in result["constraints"])
    return json.dumps(result)


# ================================================================ SQL (real SQLite)


class _SqlBudget(Exception):
    pass


def _open_db(setup_sql):
    """A fresh in-memory database built from setup SQL. Autocommit, so BEGIN/COMMIT/ROLLBACK behave like a console."""
    con = sqlite3.connect(":memory:", isolation_level=None)
    if setup_sql:
        con.executescript(setup_sql)
    con.execute("PRAGMA foreign_keys = ON")
    return con


def _split_statements(script):
    """Split at each ';' that ends a complete statement (SQLite decides: strings, comments, triggers)."""
    stmts, start = [], 0
    for i, ch in enumerate(script):
        if ch == ";" and sqlite3.complete_statement(script[start : i + 1]):
            piece = script[start : i + 1].strip()
            if _strip_sql(piece).strip() not in ("", ";"):
                stmts.append(piece)
            start = i + 1
    tail = script[start:].strip()
    if tail and _strip_sql(tail).strip():
        stmts.append(tail)
    return stmts


def _jsonable(v):
    if isinstance(v, (bytes, bytearray)):
        return "x'%s'" % bytes(v).hex()
    return v


def _run_sql(con, script):
    """
    Execute a script statement by statement. Returns (statements, error) where each statement is
    {sql, kind: 'rows'|'ok', columns, rows, total, rowcount}; stops at the first error.
    """
    counter = [0]

    def progress():
        counter[0] += 1
        return 1 if counter[0] > SQL_MAX_CALLBACKS else 0

    statements = []
    error = ""
    for stmt in _split_statements(script):
        counter[0] = 0
        con.set_progress_handler(progress, SQL_PROGRESS_EVERY)
        try:
            cur = con.execute(stmt)
            if cur.description:
                rows = cur.fetchmany(SQL_MAX_ROWS_FETCH)
                more = cur.fetchone() is not None
                statements.append(
                    {
                        "sql": stmt,
                        "kind": "rows",
                        "columns": [d[0] for d in cur.description],
                        "rows": [[_jsonable(v) for v in r] for r in rows],
                        "total": len(rows) + (1 if more else 0),
                        "more": more,
                    }
                )
            else:
                statements.append({"sql": stmt, "kind": "ok", "rowcount": max(cur.rowcount, 0)})
        except sqlite3.Error as e:
            msg = str(e)
            if msg == "interrupted":
                msg = "The query was stopped because it did too much work. Is a join missing its ON condition, or a recursive query missing its stop condition?"
            error = "%s: %s\n\nin statement:\n%s" % (type(e).__name__, msg, stmt if len(stmt) < 400 else stmt[:400] + " ...")
            break
        finally:
            con.set_progress_handler(None, 0)
    return statements, error


def _last_rows(statements):
    for s in reversed(statements):
        if s["kind"] == "rows":
            return s
    return None


def cq_sql_run(sql, setup_sql):
    con = _open_db(setup_sql)
    try:
        statements, error = _run_sql(con, sql)
    finally:
        con.close()
    return json.dumps({"ok": not error, "error": error, "statements": statements})


def cq_sandbox_run(sql, state_b64, setup_sql):
    """Persistent free-play database: restore from bytes (or build from setup), run, return new bytes."""
    con = sqlite3.connect(":memory:", isolation_level=None)
    try:
        if state_b64:
            con.deserialize(base64.b64decode(state_b64))
        elif setup_sql:
            con.executescript(setup_sql)
        con.execute("PRAGMA foreign_keys = ON")
        statements, error = _run_sql(con, sql)
        new_state = base64.b64encode(con.serialize()).decode()
    finally:
        con.close()
    return json.dumps({"ok": not error, "error": error, "statements": statements, "state": new_state})


def _norm_cell(v, approx):
    return round(v, 6) if isinstance(v, float) else v


def _rows_key(row):
    return json.dumps(row, sort_keys=True, default=str)


def _same_rows(got, want, ordered, approx):
    if len(got) != len(want):
        return False
    g = [[_norm_cell(c, approx) for c in r] for r in got]
    w = [[_norm_cell(c, approx) for c in r] for r in want]
    if approx:
        # Compare numerically with tolerance; order-insensitive matching by sorted key when not ordered.
        if not ordered:
            g.sort(key=_rows_key)
            w.sort(key=_rows_key)
        for a, b in zip(g, w):
            if len(a) != len(b):
                return False
            for x, y in zip(a, b):
                if isinstance(x, (int, float)) and isinstance(y, (int, float)) and not isinstance(x, bool):
                    if abs(x - y) > approx:
                        return False
                elif x != y:
                    return False
        return True
    if not ordered:
        g.sort(key=_rows_key)
        w.sort(key=_rows_key)
    return g == w


def _table_preview(columns, rows, limit=5):
    head = " | ".join(columns)
    lines = [head] + [" | ".join("NULL" if c is None else str(c) for c in r) for r in rows[:limit]]
    if len(rows) > limit:
        lines.append("... (%d rows)" % len(rows))
    return "\n".join(lines)


def _schema_of(con):
    tables = {}
    for (name,) in con.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%'"):
        info = con.execute('pragma table_info("%s")' % name).fetchall()
        fks = con.execute('pragma foreign_key_list("%s")' % name).fetchall()
        uniques = [i for i in con.execute('pragma index_list("%s")' % name).fetchall() if i[2] == 1 and i[3] != "pk"]
        sql = con.execute("select sql from sqlite_master where name=?", (name,)).fetchone()[0] or ""
        tables[name] = {
            "columns": [{"name": c[1], "type": c[2], "notnull": bool(c[3]), "pk": c[5] > 0} for c in info],
            "fks": [{"table": f[2], "from": f[3]} for f in fks],
            "uniques": len(uniques),
            "check": bool(re.search(r"\bcheck\b", _strip_sql(sql), re.I)),
        }
    return tables


def _match_table(tables, pattern):
    rx = re.compile(pattern, re.I)
    return [n for n in tables if rx.search(n)]


def _eval_schema_rules(con, rules):
    tables = _schema_of(con)
    failures = []
    for r in rules:
        rule, ok = r["rule"], True
        if rule == "minTables":
            ok = len(tables) >= r["n"]
        elif rule == "hasPrimaryKeys":
            ok = bool(tables) and all(any(c["pk"] for c in t["columns"]) for t in tables.values())
        elif rule == "tableLike":
            ok = bool(_match_table(tables, r["pattern"]))
        elif rule == "columnLike":
            rx = re.compile(r["pattern"], re.I)
            ok = any(rx.search(c["name"]) for n in _match_table(tables, r["table"]) for c in tables[n]["columns"])
        elif rule == "foreignKey":
            tos = set(_match_table(tables, r["to"]))
            ok = any(fk["table"] in tos for n in _match_table(tables, r["from"]) for fk in tables[n]["fks"])
        elif rule == "hasConstraint":
            ok = any(
                t["fks"] or t["uniques"] or t["check"] or any(c["notnull"] and not c["pk"] for c in t["columns"])
                for t in (tables[n] for n in _match_table(tables, r["table"]))
            )
        elif rule == "noColumnLike":
            rx = re.compile(r["pattern"], re.I)
            ok = not any(rx.search(c["name"]) for t in tables.values() for c in t["columns"])
        if not ok:
            failures.append(r["message"])
    return failures


def _sql_check(check, sql, spec):
    visible = check.get("visible", True)
    outcome = {"name": check["name"], "passed": False, "visible": visible, "message": ""}
    sources = spec.get("sources") or {}
    db_id = check.get("db") or spec.get("db")
    setup = sources.get(db_id, "") if db_id else ""
    kind = check["kind"]
    fail_msg = check.get("feedback", "")

    def crash(err):
        first = err.splitlines()[0] if err else "an error"
        return "Your SQL failed before the check could finish: " + first

    if kind == "sqlResult":
        con = _open_db(setup)
        try:
            statements, error = _run_sql(con, sql)
        finally:
            con.close()
        if error:
            outcome["message"] = crash(error)
            return outcome
        got = _last_rows(statements)
        if got is None:
            outcome["message"] = "Your SQL did not produce a result table. Use a SELECT that returns rows."
            return outcome
        ref = _open_db(setup)
        try:
            rstatements, rerror = _run_sql(ref, check["expectQuery"])
        finally:
            ref.close()
        want = _last_rows(rstatements)
        if rerror or want is None:
            outcome["message"] = "Internal check error (reference query failed): " + (rerror or "no rows")
            return outcome
        mode = check.get("columns", "count")
        ok = True
        why = ""
        if mode == "count" and len(got["columns"]) != len(want["columns"]):
            ok, why = False, "Your result has %d column%s but %d %s expected." % (len(got["columns"]), "" if len(got["columns"]) == 1 else "s", len(want["columns"]), "was" if len(want["columns"]) == 1 else "were")
        elif mode == "names" and [c.lower() for c in got["columns"]] != [c.lower() for c in want["columns"]]:
            ok, why = False, "The column names should be: %s (use AS to name a column)." % ", ".join(want["columns"])
        if ok and not _same_rows(got["rows"], want["rows"], check.get("ordered", False), check.get("approx")):
            ok = False
            if len(got["rows"]) != len(want["rows"]):
                why = "Your query returned %d row%s but %d %s expected." % (len(got["rows"]), "" if len(got["rows"]) == 1 else "s", len(want["rows"]), "was" if len(want["rows"]) == 1 else "were")
            elif check.get("ordered", False):
                why = "The right rows are there, or nearly, but they are not in the required order or have different values."
            else:
                why = "The number of rows is right, but some values differ."
        outcome["passed"] = ok
        if not ok:
            outcome["message"] = fail_msg or why or "The result did not match what was expected."
            if fail_msg and why:
                outcome["message"] = why + " " + fail_msg
            if visible:
                outcome["expected"] = _table_preview(want["columns"], want["rows"])
                outcome["actual"] = _table_preview(got["columns"], got["rows"])
        return outcome

    if kind == "sqlState":
        con, ref = _open_db(setup), _open_db(setup)
        try:
            _, error = _run_sql(con, sql)
            if error:
                outcome["message"] = crash(error)
                return outcome
            _, rerror = _run_sql(ref, check["reference"])
            if rerror:
                outcome["message"] = "Internal check error (reference script failed): " + rerror
                return outcome
            gs, ge = _run_sql(con, check["verify"])
            ws, we = _run_sql(ref, check["verify"])
            if ge or we:
                outcome["message"] = "The database is in a state the check could not read: " + (ge or we).splitlines()[0]
                return outcome
            g, w = _last_rows(gs), _last_rows(ws)
            ok = g is not None and w is not None and _same_rows(g["rows"], w["rows"], check.get("ordered", False), None)
            outcome["passed"] = ok
            if not ok:
                outcome["message"] = fail_msg or "After your statements ran, the data in the database is not what it should be."
                if visible and g is not None and w is not None:
                    outcome["expected"], outcome["actual"] = _table_preview(w["columns"], w["rows"]), _table_preview(g["columns"], g["rows"])
        finally:
            con.close()
            ref.close()
        return outcome

    if kind == "sqlScript":
        con = _open_db(setup)
        try:
            _, error = _run_sql(con, sql)
            if error:
                outcome["message"] = crash(error)
                return outcome
            _, err2 = _run_sql(con, check["script"])
        finally:
            con.close()
        expect_error = check.get("expectError", False)
        outcome["passed"] = bool(err2) == expect_error
        if not outcome["passed"]:
            outcome["message"] = fail_msg or (
                "The database accepted a change that it should have refused." if expect_error else "The database refused a change that should be allowed: " + err2.splitlines()[0]
            )
        return outcome

    if kind == "sqlSchema":
        con = _open_db(setup)
        try:
            _, error = _run_sql(con, sql)
            if error:
                outcome["message"] = crash(error)
                return outcome
            failures = _eval_schema_rules(con, check["rules"])
        finally:
            con.close()
        outcome["passed"] = not failures
        if failures:
            outcome["message"] = "Your design is missing: " + " ".join(failures)
        return outcome

    if kind == "sqlPlan":
        con = _open_db(setup)
        try:
            _, error = _run_sql(con, sql)
            if error:
                outcome["message"] = crash(error)
                return outcome
            plan = " | ".join(str(r[3]) for r in con.execute("EXPLAIN QUERY PLAN " + check["query"]))
        except sqlite3.Error as e:
            outcome["message"] = "The check query could not be planned: %s" % e
            return outcome
        finally:
            con.close()
        ok = re.search(check["mustMatch"], plan, re.I) is not None
        if ok and check.get("mustNotMatch"):
            ok = re.search(check["mustNotMatch"], plan, re.I) is None
        outcome["passed"] = ok
        if not ok:
            outcome["message"] = fail_msg or "The database is not planning the query the way it should."
            if visible:
                outcome["actual"] = plan
        return outcome

    outcome["message"] = "Unknown check kind: " + kind
    return outcome


def cq_sql_grade(sql, spec_json):
    spec = json.loads(spec_json)
    result = {"passed": False, "error": "", "errorLine": None, "checks": [], "constraints": []}
    if not sql.strip():
        result["error"] = "Your SQL is empty. Write a statement first."
        return json.dumps(result)
    result["constraints"] = _check_constraints(None, spec.get("constraints", []), sql, is_sql=True)
    result["checks"] = [_sql_check(c, sql, spec) for c in spec["checks"]]
    result["passed"] = all(c["passed"] for c in result["checks"]) and all(c["passed"] for c in result["constraints"])
    return json.dumps(result)
