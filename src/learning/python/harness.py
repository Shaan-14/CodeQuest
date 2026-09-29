"""
CodeQuest Python harness. Loaded once into the Pyodide worker by pythonEngine.ts.

cq_run(code, stdin_json)   -> JSON string   (the Run button)
cq_grade(code, spec_json)  -> JSON string   (the Submit button)

The player's code runs in a fresh namespace each time, with its own `input`, and stdout/stderr
captured. Errors are trimmed to the player's own code so beginners are not shown harness frames.
This file is trusted; the player's code is not (it is isolated by the Web Worker + WASM sandbox).
"""
import ast
import builtins
import copy
import json
import linecache
import traceback

FILENAME = "<your code>"
MAX_OUTPUT = 20000


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


def _execute(code, stdin, echo, compiled=None):
    """Run the code. Returns (namespace, stdout_capture, error_text, error_line, exc)."""
    out = _Capture()
    err = _Capture()
    env_builtins = dict(vars(builtins))
    env_builtins["input"] = _make_input(stdin, out, echo)
    ns = {"__name__": "__main__", "__builtins__": env_builtins}
    error, line, exc = "", None, None
    try:
        if compiled is None:
            compiled = compile(code, FILENAME, "exec")
        import sys

        old_out, old_err = sys.stdout, sys.stderr
        sys.stdout, sys.stderr = out, err
        try:
            exec(compiled, ns)
        finally:
            sys.stdout, sys.stderr = old_out, old_err
    except OutputLimit as e:
        error, exc = str(e), e
    except BaseException as e:  # noqa: BLE001 - the player's code can raise anything, incl. SystemExit
        exc = e
        if isinstance(e, SystemExit):
            error, exc = "", None
        else:
            error, line = _format_error(e, code)
    return ns, out, err, error, line, exc


def cq_run(code, stdin_json):
    stdin = json.loads(stdin_json)
    ns, out, err, error, line, exc = _execute(code, stdin, echo=True)
    return json.dumps(
        {
            "ok": not error,
            "stdout": out.value() + err.value(),
            "error": error,
            "errorLine": line,
            "truncated": out.truncated,
        }
    )


# ---------------------------------------------------------------- grading


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


def _check_constraints(tree, constraints):
    results = []
    for c in constraints:
        node = c["node"]
        if node.startswith("call:"):
            name = node[5:]
            found = any(
                isinstance(n, ast.Call)
                and (
                    (isinstance(n.func, ast.Name) and n.func.id == name)
                    or (isinstance(n.func, ast.Attribute) and n.func.attr == name)
                )
                for n in ast.walk(tree)
            )
        else:
            found = any(type(n).__name__ == node for n in ast.walk(tree))
        passed = found if c["type"] == "requires" else not found
        results.append({"message": c["message"], "passed": passed})
    return results


def _run_check(check, code, compiled):
    visible = check.get("visible", True)
    outcome = {"name": check["name"], "passed": False, "visible": visible, "message": ""}
    kind = check["kind"]
    fail_msg = check.get("feedback", "")

    if kind == "output":
        ns, out, err, error, line, exc = _execute(code, check.get("stdin", []), echo=False, compiled=compiled)
        if error:
            outcome["message"] = _crash_message(error)
            return outcome
        got, want = _norm_lines(out.value()), _norm_lines(check["expect"])
        if check.get("ignoreCase"):
            same = got.lower() == want.lower()
        else:
            same = got == want
        outcome["passed"] = same
        if not same:
            outcome["message"] = fail_msg or "The program's output was not what was expected."
            if visible:
                outcome["expected"], outcome["actual"] = want, got
        return outcome

    if kind == "variable":
        ns, out, err, error, line, exc = _execute(code, [], echo=False, compiled=compiled)
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
        ns, out, err, error, line, exc = _execute(code, check.get("stdin", []), echo=False, compiled=compiled)
        if error:
            outcome["message"] = _crash_message(error)
            return outcome
        fn = ns.get(check["fn"])
        if not callable(fn):
            outcome["message"] = "No function named `%s` was found. Did you define it with `def`?" % check["fn"]
            return outcome
        args = copy.deepcopy(check.get("args", []))
        cap = _Capture()
        import sys

        old = sys.stdout
        sys.stdout = cap
        try:
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

    outcome["message"] = "Unknown check kind: " + kind
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

    result["constraints"] = _check_constraints(tree, spec.get("constraints", []))
    result["checks"] = [_run_check(c, code, compiled) for c in spec["checks"]]
    result["passed"] = all(c["passed"] for c in result["checks"]) and all(c["passed"] for c in result["constraints"])
    return json.dumps(result)
