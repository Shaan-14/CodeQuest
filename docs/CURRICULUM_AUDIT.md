# Curriculum audit (Phase 4)

Written at the start of Phase 4 and updated at its end. It records what was thin, what was added, and what is still missing, so a future session can continue without guessing. **Lesson count is not a target**: each addition below exists because a real professional skill was missing or shallow.

## Method
For every track: list what the lessons taught, list what a working professional in that area does that the curriculum never asked of the player (debugging, documentation, testing, messy data, failure handling, integration, unfamiliar tools), and add lessons only where a gap was real. Every new lesson follows the permanent rules in `CLAUDE.md`: explain → runnable demo → guided practice → less-guided challenges (2 variants in different contexts) → hidden checks, reference solutions and wrong attempts validated in a real runtime.

## Before → after
| Track | Before (end of Phase 3) | After (Phase 4) |
|---|---|---|
| Python | 28 lessons | 34 lessons |
| SQL | 15 | 20 |
| Data engineering | **3** | **9** |
| Web | 26 | 31 |
| Total lessons | 72 | **94** |
| Lesson challenges | 348 | **424** (77 learning / 310 challenge / 37 independent) |
| Objectives with 2+ variants | 116 of 205 | **143 of 254** |
| Skills | 46 | 60 |
| Contexts in challenges | 34+ | 50 |
| Field Manual entries | 77 | 82 |
| Bosses | none | 3 mini, 4 mastery, 1 summit (8 bosses, 16 unfamiliar problems) |

## What was missing, and what was added

### Data engineering (was the thinnest track)
Only ETL basics, Python + SQL, and one trial existed. A data engineer's real work is trusting data and keeping jobs alive. Added (`content/dataeng/04-09`):
- **04 Trust, but Validate**: field-by-field validation of records, reporting every problem, the `bool`-is-`int` and `nan` traps (skill `de.quality`).
- **05 How Good Is This Data?**: quality reports: row counts, missing per column, duplicate keys, rule violations.
- **06 Leave a Trail**: the `logging` module, levels, handlers, formats, no duplicate lines on rerun (skill `de.observability`); the harness resets logging between runs so this is graded honestly.
- **07 Failing Safely**: retries for transient failures only, quarantine (reject file with line and reason), transactions, repeatable loads.
- **08 Only What Changed**: incremental loads with a persisted watermark; stale rows, equal timestamps, bad rows and empty files must not disturb state (skill `de.incremental`).
- **09 The Last Mile**: reports from a database written as JSON, empty-data behaviour, rounding, tie-breaks, repeatability.
The existing independent trial (`de-03`) now comes after all of them and the Foreman (mastery boss) after the trial.

### Python
Added: **text processing** (split/transform/join, the `isalnum` accent trap, runs of separators), **nested data** (JSON-shaped structures, tolerating missing pieces, flattening), **searching and sorting** (multi-key sorts; binary search whose *speed is measured* by counting how many items a function reads), **raising your own errors** (custom exceptions carrying facts, exact messages, `int()` being too forgiving), **parsing messy lines** (structured lines, real-date validation, `None` for lines that do not fit) and **learning a tool from its documentation** (the read-the-docs routine, then independent problems that never name the tool). New Field Manual entries: `itertools.groupby`, `bisect`, `heapq`, `re`, `datetime.strptime`.

### SQL
Added: **dates and text** (`strftime`, whole years between dates, `SUBSTR`/`printf`), **self-joins and set operations** (pairs listed once, both/either/but-not, the `NOT IN` NULL trap), **debugging queries** (queries that run but lie: `COUNT(*)` after `LEFT JOIN`, join fan-out; each problem starts from a broken query), **investigations** (shares, rates by group, month-over-month change with `LAG`) and **migrations** (add a column, backfill, judged on the resulting structure and data). Hidden twin databases with deliberate boundary rows were added where a near-miss must fail: `works-boss`, `works-edge`, `market-edge`.

### Web
Added: **closures and private state**, **writing tests that catch bugs** (the player's tests are run against a correct implementation and several buggy ones), **CSS positioning and stacking** (anchors, offsets, layers, sticky in a flex layout, measured in Chromium after real scrolling), **rendering from state** (one array, one `render()`, event delegation, safe text) and **reading and building web addresses** (`URL`, `URLSearchParams`, `encodeURIComponent`, origin comparison; two independent problems that never name the tool).

## Professional problem-solving coverage
- **Debugging**: broken starter queries (SQL 18), fix-the-bug web/Python tasks already present, plus the diagnosis system that names *which* skill failed.
- **Testing**: writing tests that catch mutations (Python since Phase 2, JavaScript now), boss and daily checks with reference implementations.
- **Documentation-driven learning**: Python 34 and web 31; Field Manual entries are executable so they cannot rot.
- **Unfamiliar problems**: bosses (all versions unfamiliar, hint-free), 37 independent lesson challenges, 52 dailies.
- **Integration**: Python + SQL + files + JSON in data engineering 07-09, the Summit Trial (Python over the factory database, no structure provided).

## Known gaps (recorded, not hidden)
- **Not built (still on the roadmap):** data analysis and statistics, R, Excel/spreadsheets, Git/GitHub, larger open-ended multi-technology projects. The Analytics Observatory area is still locked with a "future" rule.
- Only 8 bosses / 16 boss problems exist; when all versions of a boss have been used the oldest is offered again (documented limitation). More versions per boss are cheap to add (`content/boss/`).
- The web boss versions are tested in Chromium but the browser e2e covers the Python boss path only.
- Some skills still have a single objective (with two variants): `sql.text`, `py.nested`, `py.algorithms`, `js.closures`, `js.testing`, `js.state`. Their mastery requirements ask for one objective and two contexts.
- Authored training notes (`content/trainingNotes.ts`) are empty: refreshers fall back to the lesson's reference card. Structured `diagnostics` metadata exists as a schema and defaults; only defaults are used so far.
- Story dialogue for the new lessons is limited to a few NPC lines.
