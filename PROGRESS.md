# PROGRESS.md

_Last updated: end of Phase 3._

## Current phase
**Phase 3 (the web, Daily Challenge, retention, more independence and variants): COMPLETE.** Phase 4 has not been started; wait for explicit instruction.
(Phases 0-2 are preserved: same repo, same architecture. Save format v1 → v2 → v3 → **v4**, migrations tested; Phase 1/2 saves load unchanged and gain an empty `daily` block.)

## What Phase 3 built
**Web curriculum: the Web District (26 lessons, 125 challenges)**
- HTML 1-7 (structure, links/lists/images, tables, semantics and accessibility, forms and validation, debugging broken HTML, independent trial), CSS 8-14 (selectors and the cascade, box model, flexbox, grid, responsive design and pseudo-classes, debugging styles and building layouts, independent trial), JavaScript 15-26 (fundamentals, arrays/objects/higher-order functions, errors and debugging, the DOM, events and state, forms and validation, localStorage and JSON, timers/promises/async/await, fetch and HTTP, changing data and surviving failure (POST/PATCH/DELETE, API keys, retries, rate limits), integrated projects (machine dashboard, study planner, league stats explorer, expense log), independent trial).
- Integrated projects run HTML → CSS → JS → forms → storage → dynamic display → API → loading/errors → complete app, and are graded on structure, accessibility, computed styles and geometry at several viewport widths, behaviour through real events, persistence (with corrupt/wrong-shape storage) and failure states.
- Web District world: quests *Build the Web → Style the City → Bring It to Life → The Interactive Dashboard → The API Gate → The Web Workshop*, NPCs Builder Nia / Coder Kiran / Gatekeeper Marlo (short dialogue that follows progress), four new achievements (First Page, First Request, App Builder, Web District Cleared) and the Pixel Pin. The map layout was re-spaced so pins/labels no longer overlap on a phone.

**Web runner and API sandbox** (`docs/WEB_SANDBOX.md`): sandboxed iframe (`allow-scripts`, opaque origin, own CSP, nonce-checked `postMessage`, private storage, simulated `fetch`, virtual clock while grading); `WebCheck` helper API `h`; a deterministic in-game REST API (filters/sort/paging, methods, status codes, Bearer auth, flaky and rate-limited endpoints, latency, hidden twin data set); a network log under the preview. An endless loop in player JS freezes only the iframe: the game stays responsive and grading ends with an explanation after 8 s.

**Daily Challenge** (`game/daily*.ts`, `content/daily/`, save v4): persistent 12-hour timer (survives reload/close/save-load; clock rollback cannot re-issue or extend it), deterministic transparent selection mixing current learning and review (skill weights from staleness, evidence status and recent use; a demonstrated skill can return as a hard review), ONE attempt / NO hints / NO retry / NO reveal, rewards (coins, XP, Focus, milestone cosmetics) only on a solve and never touching mastery, history and evidence recorded, achievements (First Daily, 5/10/25/50/100, Perfect Week, Cross-Skill Master, Old Skills Still Sharp), no streak pressure. 52 authored dailies (Python, SQL, data engineering, and 20 web dailies) with metadata, reference solutions and wrong attempts.

**Retention and Practice**: `reviewsDue` (learned skills quiet for 7+ days) and new recommendation kinds `review` and `new-context`, each with a plain-language reason (days since, single-setting evidence); the Skills panel shows "due for review".

**More independence and variants**: 33 independent challenges in lessons (was 8): Python review trials A/B (`py-27`, `py-28`: receipts/formatting, plate validation, word frequency, bracket matching, defensive averages, a stock-ledger class, writing a test suite, date wording, log reports), a SQL review trial (`sql-15`: selection, NULL, capped price rise, archiving with integrity, indexing slow lookups) and web trials (`web-26`: converter, weather API, course enrolment, debounced filter, sales summary). 89 → 116 objectives with two or more variants: 13 new variants for the objectives that had only one.

**Field Manual**: 33 new web entries (HTML, CSS, JavaScript, DOM, events, forms, storage, timers, promises, HTTP, fetch, URLs, the in-game API, devtools, security, regex, accessibility), each with a page that is run in Chromium by the tests.

**Other**: rarely used screens and the editor load on demand (first load ~980 KB minified vs 1.65 MB total; see ARCHITECTURE.md "Bundle size"); future worlds and a 3D layer are **documented only** (`docs/FUTURE_WORLDS.md`).

**Counts (end of Phase 3)**: 72 lessons (Python 28, SQL 15, data engineering 3, web 26), 348 lesson challenges (55 learning / 260 challenge / 33 independent) + 52 dailies, 205 objectives (116 with 2+ variants), 46 skills, 77 Field Manual entries, 9 areas, 10 quests, 29 achievements.

## What Phase 2 built (preserved)
**Learning/retry system**
- Objectives and **variants**: 126 objectives; 72 have 2+ authored variants (same skills/concepts/difficulty; different context, data, structure). Phase 1 challenges gained variants too, without changing their ids or content.
- A failed challenge offers "Try a different problem on this idea"; the step completes when any variant passes. Every graded attempt stays in the evidence with `priorFailures`; a pass after failures is recorded as such and is never automatic mastery. Hints/lookups are recorded; hint use lowers reward and evidence strength.
- **Practice Yard** and recommendations (`game/selection.ts`, pure/deterministic, each with a stated reason): fresh problem after failure (same difficulty), less support after a guided/hinted solve, harder after consistent hint-free success, an old concept in a new context.
- Stronger evidence model: requirements across distinct challenges, objectives and contexts; `unmetRequirements` explains what is missing; still no numeric score. Skills UI groups 33 skills into 10 categories (Programming, Python, Data Structures, Debugging, Problem Solving, SQL, Databases, Data Engineering, Testing, Software Design).

**Curriculum (43 lessons, 198 challenges, 34 contexts; 37 learning / 153 challenge / 8 independent)**
- Python 15-26: lists/tuples/slicing/sorting, dicts & sets, records/aggregation, function design (defaults, scope, decomposition), debugging & exceptions, files/CSV/JSON, cleaning/validation, modules/stdlib/documentation, writing tests, OOP (encapsulation, composition, inheritance), multi-concept projects (inventory, production line, transactions, schedule, sensors), independent Ledger Vault trial.
- SQL 1-14 (Database District): SELECT/WHERE/AND/OR/NOT/IN, ORDER BY/LIMIT/DISTINCT, NULL, COUNT/SUM/AVG/MIN/MAX, GROUP BY/HAVING, joins (inner/left/multi-table), CASE, INSERT/UPDATE/DELETE with safety habits, subqueries/CTEs, window functions, schema design (keys, one-to-many, many-to-many, normalisation by migrating a flat table), constraints, indexes (`EXPLAIN QUERY PLAN`), transactions/rollback, independent Records Hall trial (two hidden-data queries and a schema design).
- Data engineering 1-3 (Pipeline Works): ETL/ELT, staging tables, idempotent loads, rejecting bad rows with a reject table and counts, Python + SQL (`sqlite3`, parameterised queries, SQL for rows and Python for the median), independent Overnight Feed trial (nightly load + abnormal-downtime investigation).
- Field Manual: 44 executable reference entries; the 10-step method card; lookups recorded.

**Engine**: SQL on real SQLite via Pyodide's `sqlite3` (fresh DB per run, foreign keys on, runaway-query guard); five databases plus hidden twins with deterministic seeded data; SQL check kinds `sqlResult/sqlState/sqlScript/sqlSchema/sqlPlan`; Python fixtures (virtual files, databases) and check kinds `file/script/tests`; `sql:` and `import:` constraints; SQL Sandbox with persistence (own localStorage key) and reset. See ARCHITECTURE.md "Phase 2 systems".

**World/story**: Database District (data-center, unlocks after Messy Data), Data Pipeline Works (after Safe and Fast), NPCs Vex/Ori/Sana/Pell, quests The Ledger Vault → The Database District → Keep the Pipeline Running (story order via `Quest.requires`), six new achievements (milestones, not skill), future areas renumbered (Web = Phase 3, Analysis/Stats/R/Excel = Phase 4, Summit = Phase 5).

## What Phase 1 built (preserved)
**RPG layer**
- Character creation (name + 4 SVG avatars), HUD with level/XP bar, Focus bar, coins, and journal (quests, pack, skills, trophies, menu).
- World map with 8 places. Unlocked by play: Academy (start), Training Grounds (accept the quest), Library (finish lesson 1), Shop (finish lesson 2). Locked for future phases: Data Center (Phase 3), Web Workshop (Phase 4), Analytics Observatory (Phase 5), The Summit (later). Locked places show why.
- Academy: Mentor Juno's intro dialogue (explains XP ≠ skill, Focus, "real code, no answers, hints cost reward"), quest board, free Rest.
- Training Grounds: robot Bolt-7 whose power tracks quest progress; 14 lesson stations showing status plus "N/M solved · K independent".
- Library: notebook of reference cards (unlocked per lesson) and the **Training Log** (evidence per skill).
- Shop: Focus consumables (snack/tea) and cosmetics (cape, cap shown on the avatar). Nothing sells answers, hints or XP.
- Inventory, quest log, 10 achievements, level-up overlay, toasts, animations, responsive layout, reduced-motion support.
- Save/load (localStorage, versioned v2, migration from v1, corrupt/newer saves backed up not destroyed), export/import as text, full reset with confirmation.

**Learning system**
- Content schema: lessons (teach / runnable demo / challenge steps), challenges (mode, difficulty, concepts, hints, behavioural checks, AST constraints, rewards), skills with mastery requirements, quests, areas with lock rules, items, achievements. See ARCHITECTURE.md.
- **Real Python** via Pyodide in a Web Worker (self-hosted, offline after first load): Run with real output/tracebacks, `input()` support, output cap, timeout by worker restart.
- **Behavioural grading**: output / variable / function-call checks with hidden edge cases and structural constraints; any valid implementation passes; wrong-but-plausible implementations fail (verified by tests).
- **Three modes**: learning, challenge, independent (one Independent Trial shipped: `py-14-warehouse-audit`; no hints, no scaffolding, no named tools).
- **Progressive hints** (3 levels), tracked in evidence and reducing reward.
- **Evidence-based mastery**: every graded submission recorded (attempts, pass/fail, hints, concepts, difficulty, support level, time, executed); `summarizeSkill` (categorical status from explicit requirements) and `detectPatterns` (repeated failure, hint reliance, guided-only, solving easily, independent success). No numeric score. XP/level are separate and never feed mastery.
- Progression: XP curve, rewards favouring independence, replay-without-hints upgrade, Focus cost for failed submissions.

**Curriculum (Python, beginner → functions)**: 14 lessons, 31 challenges, quest "Wake the Training Robot":
1 first program (what programming is, execution order, print) · 2 reading errors/debugging · 3 variables · 4 strings/f-strings · 5 ints/floats/arithmetic/operators · 6 input & type conversion · 7 booleans/comparisons/and-or-not · 8 if/else · 9 elif · 10 while · 11 for/range · 12 functions · 13 control program (capstone) · 14 Independent Trial. Contexts include engineering, manufacturing, business, finance, science, data analysis, automation, games, logistics, with one baseball problem.

## Tests performed
- **Full suite (`npm test`, Vitest): 18 files, 3,347 tests passed.** This includes every one of the 348 lesson challenges and 52 dailies validated by behaviour: Python/SQL in real CPython/SQLite (Pyodide in Node), web in **real Chromium** (starter fails, valid and alternate solutions pass, plausible wrong attempts fail, hints do not leak solutions, hidden data sets), Field Manual web examples executed, sandbox isolation and API-server unit tests, the Daily Challenge (timer, clock rollback, selection, one attempt, rewards, achievements, migration v3→v4, corrupt-block repair), retention recommendations, content-rule tests (variants differ, independents have no hints/starter/concepts, mastery requirements achievable).
- **End-to-end in real Chromium (`npm run e2e`)**: see "Final results" below: the Phase 1/2 scenarios plus Daily Challenge (offer, transparency, timer persistence across reload, no hints, one attempt, failure costs nothing, solve pays and records independent evidence), Web District (locks, NPCs, quests, an HTML lesson and the fetch lesson passing in the sandbox, network log), sandbox isolation in the real app (parent/save/network/XHR blocked, opaque origin, iframe attributes), an endless loop staying contained, Field Manual web search, retention "due for review", and phone-width overflow on the web and daily screens.
- Bugs found and fixed while testing this phase include: content-rule violations in earlier web lessons (a lesson step missing for an objective, mismatched concepts, missing hidden cases), `h.press` not delivering `key`, `settle()` overshooting virtual time by a few milliseconds, requests failed by `failNext` missing from the request log, weak checks (equivalent "wrong" attempts removed; boundary rows added to the API data), map pins overlapping on phones, and the network log that the lessons promised but did not yet exist.


**Final results (end of Phase 3):** typecheck clean; `npm test` **3,347 passed in 18 files** (real Python/SQLite and real Chromium content checks included); production build OK (first load ~980 KB minified, total JS 1.65 MB, see ARCHITECTURE.md); `npm run e2e` **32 of 32 passed** against the production build (16 Phase 1 + 6 Phase 2 + 10 Phase 3). Save migration v3 → v4 and corrupt-block repair are unit-tested; Phase 1/2 saves load unchanged.

## Known limitations / issues
- **Not tamper-proof** (unchanged): the Python worker and the web sandbox are not a server-trusted boundary; a determined player can forge results or edit their save. Fine for single-player. The web check runs in the same document as the player's page (documented in `docs/WEB_SANDBOX.md`).
- **Bundle**: first load ~980 KB minified (~285 KB gzip), dominated by the curriculum data (881 KB). Loading challenge payloads per track/lesson on demand needs an async content registry and was not done.
- Runnable languages: Python, SQLite (SQL) and browser HTML/CSS/JavaScript. No R, no Git, no spreadsheet runner yet. The in-game API simulates HTTP but not CORS, cookies, WebSockets or real latency variance.
- Web grading measures structure, computed styles and geometry with tolerances in Chromium; other browsers may differ slightly in fonts/defaults. Checks cannot judge visual taste, only stated measurable outcomes.
- Some "hidden data" tweaks are deliberate (boundary rows in the API data, a nearly-full course); a challenge that depends on an exact boundary needs the data to contain it, so changing `apiData.ts` can change content (re-run `npx vitest run src/content/web`).
- Independent evidence is much larger (33 lesson trials + 52 dailies) but the mastery requirements remain modest for some skills; a few skills still have no independent lesson trial (e.g. `web.debugging`, `web.apps` has only projects), and 89 objectives still have a single variant (mostly first-lesson learning problems and independent trials).
- Recommendation and Daily selection are simple, explainable rules, not an adaptive model or a full spaced-repetition scheduler; only a 7-day quiet period triggers a review suggestion.
- The web Daily/lesson UI has been exercised in e2e for Python dailies and web lessons; a web Daily is unit- and Chromium-tested but was not the one drawn in the e2e run.
- Database designs are judged structurally; pipeline tasks are code tasks, not a visual pipeline editor. Story dialogue is short and progress-driven. Art is CSS/SVG/emoji; no audio. Routing is in-memory. Accessibility is good in the web content, basic in the game shell.
- `sql-12-normalize-sales` has one variant because only one flat database exists; adding a second flat dataset would allow a variant.

## Recommended Phase 4 priorities
1. **Analysis and statistics** (Analytics Observatory): data analysis, statistics, visualisation; R (webR) and Excel-style spreadsheets. Reuse fixtures, hidden data, variants, dailies and the web sandbox for charts.
2. Load curriculum payloads per track/lesson on demand (async registry) to cut the first load.
3. More independent and transfer problems for the remaining skills (`web.debugging`, `web.apps`, `db.performance`, `test.assertions`), and variants for the 89 single-variant objectives.
4. A real spaced-review scheduler on top of `reviewsDue`, and a "weak spots" flow.
5. Git/GitHub simulation and research skills; open-ended multi-technology projects toward the Summit.
6. Only when asked: a 3D presentation layer and the Baseball/Racing/Magical Academy worlds (see `docs/FUTURE_WORLDS.md`).
