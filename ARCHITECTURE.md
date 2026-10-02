# ARCHITECTURE.md

How CodeQuest is built as of **Phase 5**. Read `CLAUDE.md` first for the rules; this file explains the structure and why.

## Stack and why
| Choice | Reason |
|---|---|
| **Vite + TypeScript (strict)** | Static build, no backend. Types protect the content schema, save data and runner contract over a long project. |
| **Preact** | Panel-heavy UI (editor, quest log, dialogue) suits components; ~4KB, React-like API. No router or state library: screens are plain state and game state is one store. |
| **CodeMirror 6** (+ `@codemirror/lang-sql`) | Real editor (highlighting, line numbers, undo, indentation) at reasonable size. **Autocomplete is deliberately not installed** so the editor never suggests solutions. |
| **Pyodide (CPython 3.14 → WebAssembly)** | Real Python in the browser: real output, real tracebacks, real semantics. Self-hosted (see below). Its built-in `sqlite3` module (SQLite 3.39) is also the **SQL engine** (Phase 2): no second WASM runtime. |
| **Vitest** | Unit tests, including tests that run real Python (Pyodide in Node) and real web pages (Chromium via Playwright). |
| **playwright-core** (dev only) | End-to-end tests of the built game in a real Chromium (`npm run e2e`), and the harness that validates every web challenge in real Chromium (`learning/web/testHarness.ts`). |
| **localStorage** | Enough for single-player saves; storage is injected so it can be swapped. Export/import text backup exists. |

Not chosen (add only when a phase needs it): a game engine, a router, a global state library, a backend, an autocompleting editor.

## Layout
```
index.html, vite.config.ts, tsconfig.json
scripts/copy-pyodide.mjs   copies the Pyodide runtime from node_modules → public/pyodide (gitignored, ~14MB)
e2e/run.mjs                real-browser end-to-end tests (+ screenshots to e2e/screenshots, gitignored)
src/
  main.tsx                 mounts <App/>
  core/save.ts             SaveData (v8), migrations, load/write/export/import
  learning/                the learning ENGINE (language-agnostic contracts + Python implementation)
    runner.ts              CodeRunner interface: run() and grade()
    mastery.ts             EvidenceRecord, SupportLevel, summarizeSkill, unmetRequirements, detectPatterns
    python/harness.py      Python+SQL runner/grader (executed inside Pyodide): workspace fixtures, all check kinds
    python/pythonEngine.ts glue: harness ⇄ JSON, works with any loaded Pyodide (browser worker OR Node tests)
    python/pythonWorker.ts Web Worker that loads Pyodide and hosts the engine
    python/PythonRunner.ts main-thread controller: worker lifecycle, timeouts (kill + restart)
    python/runner.ts       shared singleton
    sheet/                 Phase 5: spreadsheet ENGINE (formulas, pivots, charts) + workbook grader (recompute on hidden data)
    git/                   Phase 5: Git SIMULATOR (repo model, commands, merge, remotes/PRs) + transcript replay + repository-STATE grader
    r/                     Phase 5: real R through webR (RRunner: fresh environment per check, output/variable/script checks)
    gradeAny.ts            one entry point that grades any challenge in any language
    web/                   the WEB runner: WebRunner.ts (host), sandboxRuntime.js + sandboxPage.ts (the sandboxed page), apiServer.js/apiData.ts (in-game API), testHarness.ts (Playwright, tests only)
  content/                 curriculum and world DATA (no game logic)
    schema.ts              types: Lesson, Challenge, Check (incl. WebCheck), Constraint, Skill, Area, Quest, Item, DailyMeta...
    index.ts               registry: lessons in teaching order, lookups by id
    python/NN-*.ts         one file per Python lesson (lesson + its challenges + variants)
    sql/NN-*.ts            SQL lessons 01-14 (Database District)
    dataeng/NN-*.ts        data-engineering lessons (Data Pipeline Works)
    databases/             the game's SQLite databases as data (deterministic seeded generators) + hidden twins
    stats/NN-*.ts          Phase 5: statistics (Python) lessons 01-10 + computed-reference check helper
    sheet/NN-*.ts          Phase 5: spreadsheet lessons 01-08 (formulas -> modelling)
    git/NN-*.ts            Phase 5: Git lessons 01-06 (commits -> professional workflow)
    r/NN-*.ts              Phase 5: R lessons 01-06 (console -> a complete analysis)
    worlds.ts, worldEffects.ts   Phase 5: the learning WORLDS (tracks/areas/skills/givers) and the world-effect table (Phase 6 boundary)
    training/notes.pro.ts  Phase 5: refresher cards for every new skill
    reference.pro.ts       Phase 5: Field Manual entries for R, spreadsheets, Git and statistics
    web/NN-*.ts            web lessons 01-26 (HTML, CSS, JavaScript, DOM, events, forms, storage, async, fetch, projects, trials)
    daily/                 authored Daily Challenges (Python, SQL, data-eng, web) + test-only solutions
    boss/                  boss problems (Python, SQL, data engineering, web, summit): versions per boss + test-only solutions
    bosses.ts, campaign.ts boss definitions (gates, story, rewards) and the finite campaign spine (acts, ending)
    composites.ts, diagnostics.ts, trainingNotes.ts   composite skills, diagnostic metadata defaults, refresher notes
    python/variants-phase3.ts extra variants attached to older lessons (appended by index.ts); python/27-28, sql/15 review trials
    reference.ts, reference.web.ts  the Field Manual (in-game documentation; every example executed by a test)
    **/solutions*.testdata.ts  TEST-ONLY reference solutions + wrong attempts (never imported by the app)
    skills.ts, world.ts, npcs.ts, mentor.ts, avatars.ts, helpers.ts
  game/                    PURE game rules on SaveData (no UI, no storage)
    actions.ts             every state transition: (save, …) → { save, events }
    progression.ts         XP curve, levels, rewards (independent of mastery)
    selection.ts           pure, deterministic variant picking + practice recommendations
    backfill.ts            fills evidence fields missing from older saves at load
    graph.ts               Phase 5: THE skill graph (competencies, gaps, access, eligibility)
    worldEvents.ts, explore.ts, balance.ts   Phase 5: world-effect events + derived world state; worlds visited; the balance table
    daily.ts, dailySelect.ts, retention.ts   the Daily Challenge, its deterministic selection, and retention memory / the spaced-review schedule
    evidence.ts, diagnosis.ts, weakness.ts, training.ts, trainingPlan.ts, trainingNeeds.ts, skillHistory.ts, returnPoint.ts, boss.ts   Phase 4: adaptive training, bosses (see "Phase 4 systems")
    achievements.ts, world.ts (unlock rules, quest offers), lessons.ts (status helpers, tracks), events.ts
    store.ts               reactive store: applies action results, persists, queues toasts
  app/                     UI: App.tsx (routing), screens/, components/, styles.css
```

## Data flow
```
content (data) ──► app UI ──► PythonRunner ──► Web Worker ─► Pyodide ─► harness.py
       ▲              │  results (RunResult / GradeResult)                 │
       │              ▼                                                    │
   game/actions (pure) ◄── submitChallenge(passed, timeMs, code) ◄─────────┘
       │  ├─ appends an EvidenceRecord (pass OR fail)
       │  ├─ pays XP/coins (progression.ts)         ← engagement only
       │  └─ unlocks areas/achievements, advances quests
       ▼
   store.ts → localStorage (versioned save) + toasts
learning/mastery.ts reads ONLY save.evidence → SkillsView ("Training Log")
```
**XP/level and mastery never read each other.** `progression.ts` doesn't import evidence; `mastery.ts` doesn't import XP. The Skills view shows no XP on purpose.

## Content model (src/content/schema.ts)
- **Lesson**: ordered `steps` of three kinds: `teach` (text), `demo` (runnable example the player must run), `challenge` (reference to a Challenge). Plus a `reference` card that appears in the Library notebook when completed, `prerequisites`, and `xpReward`.
- **Challenge**: id, `mode` (learning | challenge | independent), language, `skillIds`, `concepts`, `difficulty` 1–5, prompt, optional expectedBehavior/guidedSteps, starterCode, sampleInput, `hints[]`, `checks[]`, `constraints[]`, XP/coin rewards, `transfer`, `context`.
- **Checks** describe *behaviour*, not an expected source string: `output` (stdout for given stdin), `variable` (value after running), `call` (call the player's function, compare return value and/or printed output). Each check is `visible` (shows expected vs actual on failure) or hidden (only says a hidden case failed). `feedback` is an authored nudge.
- **Constraints** are structural rules on the AST (`requires`/`forbids` a node such as `For`, `While`, `FunctionDef`, `JoinedStr`, or `call:range`) so a loop lesson cannot be passed by typing ten `print`s.
- **Skill** has `masteryRequirements` (independent passes, distinct challenges, min difficulty). `content.test.ts` verifies the shipped content can actually satisfy every requirement.
- **Area** has a `LockRule` (`none`, `questAccepted`, `questComplete`, `lesson`, `future`). Shipping a new phase = add lessons and change an area's lock from `future` to a real rule.

### Learning modes (guidance shrinks)
| Mode | Player sees | Hints |
|---|---|---|
| `learning` | explanation, guided steps, expected behaviour, scaffolded starter | yes, recorded; evidence support = `guided` |
| `challenge` | goal + expected behaviour | yes, but reduce reward; hint-free pass = `independent` |
| `independent` | **problem statement only**: no concept names, no expected-behaviour text, no starter, no named tools/functions | none (content test enforces empty `hints`, blank starter, no constraints, no concepts) |
Phase 1 ships one independent trial (`py-14-warehouse-audit`). Later phases should add more, with less-and-less context, plus true "unfamiliar technology" problems (`transfer: true` gives `transfer` support).

## Evidence & mastery (learning/mastery.ts)
Every **graded submission** (pass or fail) appends an `EvidenceRecord`: challenge, skills, concepts, mode, difficulty, passed, `support` (`guided` | `hinted` | `independent` | `transfer`), hintsUsed, attemptNumber, active time, `executed`. Only executed evidence counts.
- `summarizeSkill` → counts + a categorical status (`none`, `attempted`, `guided`, `developing`, `demonstrated`) from explicit requirements. **No numeric mastery score exists, by design.**
- `detectPatterns` → `repeated-failure`, `hint-reliant`, `guided-only`, `solving-easily`, `independent-success`. Simple, visible thresholds. Phase 1 only *shows* them ("mentor's notes"); nothing adapts yet. Future adaptive systems should build on these and on the evidence log, not invent hidden scores.
- Reward design (progression.ts): independence pays more (challenge mode: ×1.25 with no hints; ×(1−0.2/hint, min 0.5) with hints; independent ×1.5; learning ×(1−0.1/hint, min 0.6)). Passing again pays nothing; "Replay without hints" (`startReplay`) resets the hint count so a stronger pass records stronger evidence and pays only the difference.
- Failed submissions cost Focus (10). At 0 the Submit button is disabled until the player rests at the Academy (free) or uses a consumable. Run is always free.

## Code execution
**Python via Pyodide, in a dedicated Web Worker**, self-hosted from `public/pyodide/` (copied from the `pyodide` npm package by `scripts/copy-pyodide.mjs`; no CDN, works offline after first load).
- `run` executes the program with a friendly, trimmed traceback (only frames from the player's code, file name `<your code>`), captured stdout, `input()` fed from the "Program input" box (echoed in Run so the transcript reads naturally).
- `grade` runs each check in a **fresh namespace**; `input()` prompts are swallowed so graders don't depend on prompt wording; stdout compared after trimming trailing whitespace; numbers compare with optional tolerance; `True` ≠ `1`. A function that prints instead of returning gets a specific explanation.
- Output is capped (20,000 chars) so `while True: print(...)` stops fast with a message.
- **Timeouts**: a synchronous infinite loop cannot be interrupted without SharedArrayBuffer (which needs COOP/COEP headers). Instead `PythonRunner` **terminates the worker** after the timeout (8s run / 10s grade), shows a helpful message, and starts a fresh worker. Cost: a few seconds to restart. Chosen for simplicity/robustness with no special hosting requirements.
- The same `pythonEngine.ts` runs in Node under Vitest against real CPython, which is how all curriculum content is validated (`content.test.ts`).
- Adding a language: implement `CodeRunner` (+ new `Check` kinds if needed) in `src/learning/<lang>/`; content and UI stay unchanged. Planned: JavaScript (sandboxed iframe/worker), SQL (SQLite-WASM), R (webR), HTML/CSS (sandboxed iframe DOM checks).

## Phase 2 systems

### Objectives and challenge variants (retry system)
A **learning objective** (`Objective`: one underlying idea) is tested by several **variants**: ordinary `Challenge`s sharing an `objectiveId` (a challenge without one is its own objective). Variants must share language, skills, concepts and difficulty and differ in **context, data and structure** (a content test enforces the first three and requires distinct contexts). `content/index.ts` exposes `variantsOf(objectiveId)`. In a lesson the challenge step is a **slot** (`LessonScreen.ChallengeSlot`): after a failure or a pass the player can switch to another variant; the step counts as done when ANY variant is passed.

`game/selection.ts` is pure and deterministic (same save -> same choice, so it is testable):
- `pickVariant(save, objective, currentId)`: never-passed before passed, then fewest attempts, then least recently attempted, then authoring order; the current variant is avoided whenever another exists, so a retry is always a different problem.
- `recommendPractice(save)`: reads evidence and proposes **explainable** practice (kinds `retry`, `less-support`, `revisit`, `harder`, `next-lesson`; each carries a plain-language reason): a failed objective -> a fresh variant at the same difficulty; a hinted/guided solve -> a different problem without hints; a stale concept with only guided/developing evidence -> a problem in a new context; consistent hint-free first-try solving (`solving-easily`) -> a harder objective (one step above what was handled independently). Only unlocked content is offered.
- UI: the **Practice Yard** (Training Grounds) and `Recommendations` cards; `PracticeRun` runs a variant outside a lesson. Failed attempts are never erased: each graded submission appends an `EvidenceRecord` with `priorFailures` (failures on this objective so far), so a retry success is recorded as "passed after N failures", not as a clean pass and never as automatic mastery.

### Evidence model (v3)
`EvidenceRecord` gained `objectiveId`, `context`, `lookups` (Field Manual entries opened while solving: research behaviour, free of reward penalty), `priorFailures`, `project`. `summarizeSkill` still returns a categorical status, now requiring independent passes across **distinct challenges, distinct objectives and distinct contexts** (`MasteryRequirements.distinctObjectives/distinctContexts`), and a minimum difficulty; only hint-free (independent/transfer) passes count towards independence. `unmetRequirements` tells the UI which requirement is missing (shown in the Training Log, never as a number). **No numeric mastery score exists.** Save v3 migration (`core/save.ts`, 2->3) adds the new fields; `backfillEvidence` fills `context` at load because content is not available to the save layer.

### SQL engine and databases
SQL runs on real SQLite through CPython's `sqlite3` inside the same worker (`harness.py`: `cq_sql_run`, `cq_sql_grade`, `cq_sandbox_run`). Each run gets a fresh in-memory database built from the database's setup SQL (`content/databases`: `works` factory, `market` shop, `league` sports, `flat` denormalised sales, `blank`); foreign keys are ON; runaway queries are stopped by a SQLite progress handler; statements are split with `sqlite3.complete_statement` and executed one by one so each shows its own result table or affected-row count.

Grading is by **result or state, never source text**. Check kinds (`content/schema.ts`):
- `sqlResult`: run the player's query and a REFERENCE query on the visible database AND a **hidden twin** (`works-b`, `market-b`...: same schema, different rows; hard-coded answers fail). Options: `ordered`, `columns` (`count|names|ignore`), `approx`.
- `sqlState`: run the player's script, then compare verify queries with the state after the reference script (INSERT/UPDATE/DELETE, CREATE, transactions).
- `sqlScript`: a probe statement must succeed or fail (constraint tests, `expectError`).
- `sqlSchema`: structural rules on the resulting schema (`minTables`, `hasPrimaryKeys`, `tableLike`, `columnLike`, `foreignKey`, `hasConstraint`, `noColumnLike`): design tasks accept any sensible schema.
- `sqlPlan`: `EXPLAIN QUERY PLAN` must (not) match a pattern (index lessons).
Constraints can require SQL constructs via `sql:<regex>` (comments/strings stripped) when a concept is the point (e.g. a JOIN lesson must join).

`databasesUsedBy(challenge)` lists every database a challenge needs; the UI sends `sourcesFor(...)` to the runner. The in-game **SQL Sandbox** (`SqlSandbox.tsx`) serialises the whole database (`con.serialize()`, base64) into `localStorage` key `codequest.sandbox.v1` **separate from the game save**; reset deletes only that entry; sandbox use never writes evidence.

### Python + files + databases
Python challenges can declare `fixtures`: virtual `files` (CSV/JSON to read) and `databases` (`works` -> `works.db`; `works-b:works` builds the hidden twin AS `works.db`). A check may add its own fixtures (a check's database with the same file name replaces the challenge's), so the same solution is graded on hidden data. New Python check kinds: `file` (compare a file the program wrote, optionally as parsed JSON), `script` (authored Python asserts run in the player's namespace: classes, sqlite3 work, idempotency by calling the player's function twice), `tests` (the PLAYER writes `test_*` functions that must pass on a correct implementation and fail on each planted bug).

### Field Manual and the research method
`content/reference.ts` is searchable in-game documentation (Python stdlib/builtins, SQL clauses). Every example is executed by `reference.test.ts` so it cannot rot. Opening an entry during a challenge is recorded as a lookup. The Method card lists the 10-step process for unknown problems. Independent challenges are deliberately posed so some need tools that were never taught.

### World, NPCs and story
Areas are data (`content/world.ts`). Phase 2 repurposes the sealed **Data Center** as the **Database District** (unlocks after `py-21-cleaning`) and adds the **Data Pipeline Works** (after `sql-13-integrity-performance`). `content/npcs.ts` holds characters (Architect Vex, Engineer Ori, Analyst Sana, Dr. Pell) whose advice follows the player's completed lessons. Story quests (`ledger-vault` -> `database-district` -> `pipeline-works`, ordered by `Quest.requires`) are offered by their givers (`QuestOffers`) and complete when their lessons do; quests are pacing, never mastery. Lessons belong to a **track** (`game/lessons.ts: trackOf`, from the id prefix) which decides the area that lists them.

### Curriculum layout (Phase 2)
43 lessons: Python 1-14 (Phase 1), Python 15-26 (lists, dicts/sets, records, function design, debugging, files/CSV/JSON, cleaning, libraries/docs, testing, OOP, projects, independent trial), SQL 1-14 (select ... window functions, design, integrity/indexes/transactions, independent trial), data engineering 1-3 (pipelines/ETL/ELT/idempotency, Python+SQL, independent trial). 198 challenges over 126 objectives (72 objectives have 2+ variants), 34 contexts, 8 independent challenges, 33 skills in 10 categories.

## Phase 3 systems

### Web runner and grading (see `docs/WEB_SANDBOX.md`)
`language: 'web'` challenges hold three files (`WebFiles`: html, css, js) and are graded by **`WebCheck`s**: an async script run inside a sandboxed iframe against the live page, with a helper `h` (DOM queries, real events, computed styles/geometry, virtual-clock `tick/settle`, `storage`, `api`, `errors`). Options per check: `viewport`, `api: 'a'|'b'` (visible or hidden data), `storage` seed, `errorsOk`. The iframe is `sandbox="allow-scripts"` without `allow-same-origin` (opaque origin), loads a separate `web-sandbox.html` with its own strict CSP, talks to the game only by nonce-checked `postMessage`, and has its own private storage and a simulated `fetch`. Content is validated in real Chromium (`content/web/web.test.ts`): starters fail, valid solutions pass, wrong attempts fail. UI: `WebWorkbench` (HTML/CSS/JS tabs, live preview, console, network log for the in-game API).

### The in-game API
A deterministic REST/JSON simulation (`apiServer.js`; data in `apiData.ts`): collections with filters/sort/paging, one-item GETs, POST/PUT/PATCH/DELETE with realistic status codes, a Bearer-key endpoint (401), a flaky endpoint (503 twice), a rate-limited endpoint (429 + `Retry-After`), simulated latency on the virtual clock, and a hidden twin data set. It never touches the network.

### Web curriculum
26 lessons in the Web District (`content/web/`): HTML (structure, links/lists/images, tables, semantics and accessibility, forms, debugging, independent trial), CSS (selectors and the cascade, box model, flexbox, grid, responsive design and pseudo-classes, debugging styles and layouts, independent trial), JavaScript (fundamentals, arrays/objects/higher-order functions, errors and debugging, the DOM, events and state, forms and validation, localStorage and JSON, timers/promises/async, fetch/HTTP/APIs, changing data and failure handling, complete applications, independent trial). The integrated projects run HTML -> CSS -> JS -> forms -> storage -> dynamic display -> API -> loading/errors -> complete app. Quests: Build the Web, Style the City, Bring It to Life, The Interactive Dashboard, The API Gate, The Web Workshop; NPCs Builder Nia, Coder Kiran, Gatekeeper Marlo.

### Daily Challenge (`game/daily.ts`, `dailySelect.ts`, `retention.ts`, `content/daily/`)
- **State** (`save.daily`, save v4): `current` (challenge, skill, category, focus, difficulty, reward, reason, `issuedAt`, `expiresAt`, status `open|passed|failed`), `history`, `lastSeenAt`. Pure `refreshDaily(save, nowMs)` and `submitDaily(save, nowMs, ...)` return `{ save, events }` like every other action.
- **Timer**: a daily lasts 12 hours (`DAILY_PERIOD_MS`), persisted, so it survives reload, closing the browser and export/import. The clock guard `effectiveNow = max(now, lastSeenAt)` means setting the system clock back cannot re-issue or extend a daily. When a period ends the unfinished daily is recorded as `missed` (no penalty) and ONE new daily is issued (no backlog, no streak).
- **Selection** (deterministic, no randomness, every pick explained): nothing until something is learned; the kind alternates (current learning / review of an older skill); skills are weighted by staleness, evidence status (need) and recent use; the challenge pool is authored dailies whose required lessons are complete plus challenge/independent lesson challenges from completed lessons (never an untaught concept); target difficulty depends on the evidence (a demonstrated skill can get a hard problem, never more than one above the best difficulty already passed for current learning); challenges used in the last 12 dailies are skipped when possible.
- **One attempt**: no hints, no retry, no solution reveal; a failure costs no Focus but the attempt is kept as evidence (`support: independent/transfer`, `hintsUsed: 0`). **Rewards only on success**: coins/XP scale with difficulty (+25% for review), +Focus; milestone cosmetics at 10/25/50 solves. Rewards never touch mastery; mastery still comes only from evidence.
- **Achievements** (milestones, not skill): First Daily, 5/10/25/50/100 Dailies, Perfect Week (7 solves in any 7-day window, not consecutive), Cross-Skill Master (4 categories), Old Skills Still Sharp (5 hard review solves).
- **Content**: 52 authored dailies (Python, SQL, data engineering, web), independent-style (no concept tags, all checks hidden, required lessons that exist), each with reference solutions and wrong attempts in `solutions*.testdata.ts`.

### Retention and Practice recommendations (`game/retention.ts`, `game/selection.ts`)
`skillReviews` derives, per skill, when it was last practised, its status, independent passes and daily outcomes, all from the evidence log and daily history (nothing stored twice, no hidden score). `reviewsDue` lists learned skills quiet for 7+ days, longest first, with a plain-language reason. `recommendPractice(save, max, nowMs)` proposes, in order: a fresh problem after a failure, less support after a hinted solve, a **review** of a skill that has gone quiet (harder if it was shown independently), a revisit of a shaky skill, a **new setting** when every independent solve was in one context, a harder objective, the next lesson. Each carries its reason; the Skills panel also shows "due for review" with the number of days.

### Independent trials and variants added in Phase 3
33 independent challenges in lessons (Python 12, SQL 8, data engineering 2, web 11) including review trials on older skills (`py-27`, `py-28`, `sql-15`), plus the independent-style dailies. Objectives that had a single variant gained variants (`content/python/variants-phase3.ts`); 116 of 205 objectives now have 2 or more authored variants.

### Bundle size and code splitting
Measured at the end of Phase 3 (`npm run build`): total JS 1.65 MB minified. First load is ~980 KB minified (index 55 KB + preact 19 KB + **curriculum data 881 KB (~249 KB gzip)** + game rules 26 KB); the **editor (CodeMirror, 523 KB) and every rarely used screen load on demand** (lesson/challenge screens, Library, Shop, Daily, Practice, SQL sandbox, Field Manual, language modes), so title/map/academy no longer wait for the editor. Phase 2 shipped ~900 KB in one chunk; the curriculum roughly doubled and the first load grew only ~9%. The remaining weight is data: the next step is to load challenge payloads (checks, prompts) per track/lesson on demand (needs an async content registry: not done in Phase 3).

## Phase 4 systems: adaptive training, bosses and the campaign
The idea: **you do not redo old lessons; you train the weakness, prove improvement, and return to where you were.** Everything is deterministic and authored (no LLM); it reads the append-only evidence log.

### Evidence, diagnosis, weaknesses (`game/evidence.ts`, `diagnosis.ts`, `weakness.ts`)
- Every graded attempt (lesson, practice, daily, training, boss) goes through `buildEvidence`, which records the source, the structured failure (`FailureDetail`: error kind, failed check names, hidden vs visible, constraints), hint levels and, for training/boss, their ids. Daily and boss attempts are always independent-style evidence.
- `diagnose(save, challenge)` reads the latest record and returns `null` (a clean pass, or a first ordinary slip by a brand-new learner) or a `Diagnosis`: **severity** (minor / moderate / serious / major, explicit rules over failures on this objective, hints used, the share of checks passed, hidden-only failures, error kind, earlier independent strength and how many different objectives failed recently), **kind** (`concept`, `application` (a new context), `combination` (skills known separately, failing together), `hint-reliance`), the skills involved (attributed from the failed checks via `Challenge.diagnostics`), and reasons in plain language.
- `applyDiagnosis` creates or merges a **`Weakness`** (`save.training.weaknesses`; merged by key, severity escalates). `resolveOnPass` resolves minor/moderate weaknesses when the player later passes a *different* problem independently; bigger ones need their plan. Weaknesses are history: never deleted, never lower a skill's status.

### Focus (game/focus.ts, save v7)
- **Rule**: Focus 100 = ready, < 100 = train first. `submitChallenge`, `submitBoss`, `submitDaily` and `revealHint` do nothing below 100; `advanceStep`/`completeLesson` are held by `requiredTraining`. The two always agree: a setback creates a required weakness + plan and costs Focus in the same action; finishing the plan restores Focus; `sanitizeFocus` repairs a save that has low Focus but no active required plan (so nothing can be stuck).
- **Setbacks**: a failed lesson attempt in challenge/independent mode (level 1 small, 2 difficult (difficulty ≥ 3), 3 independent), a pass that used hints (`HINTED_PASS_LOSS`), a failed boss (4 mini, 5 mastery/summit). Guided exercises and Practice Yard attempts cost nothing. The failure level also sets the minimum plan depth (`minPlan`).
- **Earning it back**: `assignStepFocus` splits the Focus owed over the unfinished steps by `STEP_WEIGHT` (proof takes the remainder), each completed step calls `gainFocus`, and a failed proof grows the plan and re-splits what is still owed. `deep` plans have four practice steps.
- **Removed**: the Academy Rest action, `useItem`, and the Focus consumables (migration 6 -> 7 sets old saves to full Focus and refunds any owned consumables in coins). Daily Challenges cost no Focus on failure but need 100 to attempt and no longer pay Focus.
- UI: `FocusGate.tsx` (`FocusMeter`, `NotReadyPanel`), Mentor card (`DiagnosisCard`) with small/major wording, Training Grounds showing Focus needed and per-step rewards, return to the exact challenge/boss.

### Required training and the Training Grounds (Phase 4 revision, save v6)
- **The loop**: FAIL → DIAGNOSE (Mentor) → Training Grounds → targeted training → ONE fresh proof problem without help → return to the exact place. A meaningful failure in a lesson challenge, or any failed boss attempt, creates a *required* weakness (`Weakness.required`, source 'lesson' or 'boss'; a hinted pass in a *learning*-mode exercise is never required). Practice, daily and quiet-skill weaknesses stay optional (Training Board only).
- **`requiredTraining(save)`** (first weakness with `required && status !== 'resolved'`) is the single source of truth for the block; it is derived from saved state, so it survives reloads. Guards live in the game layer, not only the UI: `submitChallenge`, `advanceStep` and `completeLesson` do nothing while it is set (no retry, no other variant, no skip, no next lesson); `abandonTraining` refuses a required plan. Curriculum progress is never rolled back.
- The plan is created at failure time (`ensureRequiredPlan` with a `ReturnPoint`: lesson + step + challenge, or the boss gate), so the Training Grounds already has it waiting.
- **Plan shape** (`shapeFor`): `refresher` = review + proof; `targeted` = review, example, practice, proof; `extended` adds a prediction and another practice; `deep` adds prerequisite reviews and a third practice. There is exactly ONE `independent` step and it is last. A failed proof marks itself failed and appends practice (plus a prediction and prerequisite reviews from the second escalation) and a NEW proof. A hint means `refresher` (short reinforcement, then one proof).
- **Authored content** (`content/training/`): `modules.ts` (reframing, pitfalls, a worked example in a different setting, a prediction with real Python output verified by tests, keyed by skill ids; `moduleFor` picks the largest module fully inside the weakness so combinations get combination content), `problems.ts` (`tr-*` practice and proof problems, proofs are `independent` mode with no hints/starter, SQL ones use hidden twin databases), `solutions.testdata.ts` (reference + wrong attempts). Problem order: authored → problems from lessons other than the exposing one → any fresh problem (last resort, documented in limitations).
- **UI**: `TrainingYard` is a map area of its own (`training-yard`, "Training Grounds"; the Python lessons area keeps id `training-grounds` and is displayed as "Programming Hall"). It shows ONE required-training panel (why, where you return, a single Start/Continue button) or, when nothing is required, the optional Training Board. `DiagnosisCard` is the Mentor: diagnosis + a single "Go to the Training Grounds" button. `LessonScreen` shows only a blocked panel when opened during required training; `App` shows a banner on every other screen and the map pulses the Training Grounds pin. `TrainingRun` steps: a different way to see it → a different example → predict → practice → fresh problem.

### Training (`game/training.ts`, `trainingPlan.ts`, `trainingNeeds.ts`)
- `startTraining(save, weaknessId, returnTo)` builds a **`TrainingPlan`** sized to the weakness (`refresher` / `targeted` / `extended` / `deep`): `review` (a note), `example` (a runnable demo), `guided` and `practice` (hints allowed), `combined` (skills together), `independent` (no hints). `pickFresh` draws each problem from **taught** content plus eligible dailies, ranking by objective penalty (the failed objective, then already-used ones), context, not-yet-passed, difficulty distance and skill focus. The exposing lesson's return challenge is a different variant.
- A failed proof **escalates** the plan (see above). There is no failure limit and no lockout timer; training costs no Focus (+8 Focus per passed step).
- **Return points** (`ReturnPoint`): the plan remembers where the player was (lesson + step, boss gate, area). Training never changes `learning.lessons`, quests or areas; while training is required, curriculum actions are held (see above), but nothing already done is undone.
- The **Training Board** (`trainingNeeds`) lists, in priority order: demonstrated weaknesses, weak combinations, quiet/rusty skills, prerequisites for the next lesson, older skills worth proving, each with a reason.
- `skillHistory` shows previous independent performance next to recent trouble (contexts demonstrated vs struggled, recent attempts, training, later independent solves) and derives **composite** skills from evidence on challenges that used all component skills (`content/composites.ts`, 20 of them).

### Bosses and the campaign (`game/boss.ts`, `content/bosses.ts`, `content/boss/`, `content/campaign.ts`)
- 3 mini-bosses (gate guardians: Python functions, SQL joins, JavaScript), 4 **mastery bosses** (Python, SQL, data engineering, web) and the **Summit Trial**. Each has several *versions* (different problems and data), all independent-style: no hints, no starter, hidden checks, one attempt per version. Gates are data: lessons completed and earlier bosses beaten.
- A failed attempt records evidence, diagnoses (a boss failure is always a weakness) and starts training whose return point is the boss; the boss is **sealed** until that training is complete (or the weakness is resolved), then `nextVersion` offers a version never attempted; repeated misses raise the weakness severity (deeper training). Winning pays rewards and records evidence; it is never a mastery mark. `campaign.completedAt` is set once when the Summit Trial is passed.
- Bosses are not lesson content: `getAnyChallenge` finds them, but lessons, dailies, the Practice Yard and training never draw them.

### Save v5
`SAVE_VERSION = 7` (Focus gate: `TrainingStep.focus`, plan `focusLevel`/`focusLost`, weakness `focusLevel`; migration 6 -> 7 as above). Version 6 added `Weakness.required` ( migration 5 → 6 changes nothing, so old weaknesses stay optional and no old save is suddenly blocked). Version 5 added `training` (weaknesses, plans, active plan, id counter), `bosses` (attempts and remediation per boss) and `campaign`. Migration 4 → 5 adds empty blocks; `sanitizeTraining`/`sanitizeBosses` repair corrupt blocks instead of rejecting the save. Evidence records gained optional `failure`, `hintLevels`, `source`, `training`, `boss` (older records load unchanged).

### UI added
`DiagnosisCard` (the Mentor: diagnosis + one "Go to the Training Grounds" button), `TrainingYard` (the Training Grounds place) and `TrainingHub` (the optional board, only inside the Training Grounds), `TrainingRun` (plan runner; the header always says where you will return to), `BossHall` (the Summit area) and `BossRun`, composites and history notes in the Skills view, blocked-lesson panel and required-training banner. Lazy chunks keep the first load small.

### Bundle note
The curriculum is still one chunk (~1.14 MB minified, ~329 KB gzip); rarely used screens, the editor and the boss/training screens load lazily. Per-track loading is the recommended next step.

### Harness note
`harness.py` resets logging state before every run so a program cannot pass because of `logging` configuration left by an earlier run.

## Phase 5 systems: a nonlinear skill graph, more technologies, open-ended finale
The idea: **the player chooses the path; the game only ever asks what they can demonstrate.** Nothing here replaced the Phase 4 loop (fail → diagnose → train → fresh proof → return, Focus 100 = ready); it generalised the ground the loop stands on.

### The skill graph (`game/graph.ts`, `content/worlds.ts`, `content/skills.ts`)
- **Worlds** (`content/worlds.ts`): Python, SQL, Web, Git, Spreadsheets, R are *foundations* (open from the start, freely switchable); Statistics and Data Engineering are skill-gated; each world owns a map area, lesson-id prefixes, skill-id prefixes and its quest givers. `trackOfLessonId`/`trackOfSkillId` are the only mappings.
- **Competency** (`competencyOf`): `none < introduced < developing < demonstrated`, derived from the evidence log (a completed lesson or guided pass = introduced; an independent pass = developing; a skill's mastery requirements = demonstrated). XP/level/quests never enter. A per-save `WeakMap` snapshot keeps dailies that test hundreds of challenges cheap.
- **Edges are data**: `Skill.prerequisites`, `Lesson.prerequisites` (same-world order) and `Lesson.requires` (`SkillReq`: a skill at a level, a composite, or a solved objective; any world), `Challenge.requires`, `Area.lock` (`skills` or `lessonsCompleted`). One evaluation path: `lessonGaps` / `lessonAccess` / `areaGaps` / `challengeGaps` / `challengeEligible`; `Gap.teach` always names the first lesson on the path that is **open now** (`nextOpenLesson`), so "go learn X" never points at something that is itself blocked. `unlocksOf` answers "what does showing this help open?".
- **Enforcement is in the game layer** (`submitChallenge`, `advanceStep`, `completeLesson` refuse a lesson whose gaps are not met), not only in the UI. The UI (`PrerequisitePanel`, `Locked`, `WorldChooser`, `LessonList`, `WorldMap`) renders the same gaps: which skills, which level, what you have, where to learn it, what it unlocks.
- **Eligibility outside lessons**: practice, dailies and training draw only challenges whose skills are all at least *introduced* (`challengeEligible`), never a concept the player has not met, in any world.

### More technologies, each with a real grader (`learning/sheet|git|r`)
- **Spreadsheets**: a formula engine (~60 functions, cross-sheet refs, absolute refs, approximate and exact lookups, conditional aggregates, dates/text) plus pivot tables and charts. A challenge is a workbook; the grader parses the player's workbook JSON, enforces locked cells, applies `with` overrides (hidden data), recomputes and compares cells/pivots/charts. UI: `SheetWorkbench` (grid, formula bar, pivot and chart builders).
- **Git**: `repo.ts`/`commands.ts`/`merge3.ts` simulate a repository (index, commits, branches, detached HEAD, three-way merge with conflict markers, stash, tags, remotes, pull requests and reviews). `replay` runs the player's transcript against a `RepoSnapshot`; `grade` checks the resulting STATE (files, branches, commits, messages, remote, PRs), never the commands. UI: `GitWorkbench` (terminal with file viewer and repo graph).
- **R**: real R through webR (`r/RRunner.ts`; runtime copied to `public/webr` by `scripts/copy-webr.mjs`). Every check gets a fresh environment, so nothing leaks between runs; checks are `output`, `variable` and `script` (R assertions run after the player's code, optionally with a `prelude` of hidden inputs). Output comparison ignores trailing spaces per line.
- **Statistics** lessons are plain Python with `stats/helpers.ts: statCalls` (expected values computed by an embedded reference, compared with a tolerance; reference helper names are `_rf_*` so they can never overwrite the player's). Field Manual entries for all four worlds live in `content/reference.pro.ts`; `reference.pro.test.ts` executes every example.

### Dailies, spaced review, training, balance
- **Daily** (`game/dailySelect.ts`): kind rotates `current → review → mixed`. The pool is every non-guided challenge (authored dailies + lesson challenges) whose skills are introduced, from ANY world; *mixed* prefers cross-world or transfer challenges and says so in its reason. Still: one attempt, no hints, no retry, never costs Focus, evidence only (`Challenge` → `DailyRun` now supports python/sql/web/sheet/git/r).
- **Spaced review** (`game/retention.ts` `reviewSchedule`): interval from the record: streak of independent hint-free passes → 2/7/14/30/60 days; a failure or hinted pass → next day; work only at difficulty ≤ 2 → 60%; the clock restarts on any executed evidence. `reviewsDue` feeds the Training Board and the Skills view; every entry carries its reasons.
- **Global training**: unchanged mechanics (see Phase 4), now over every world: `taughtPool` uses `availableObjectives` (which honours cross-world `requires`), refresher cards are authored for every new skill (`trainingNotes`), plans share the Focus that was lost.
- **Balance** (`game/balance.ts`): Focus losses, plan shapes, review intervals and daily rewards in one readable table, guarded by `balance.test.ts`.

### The Summit, open-ended (`content/bosses.ts`, `game/boss.ts`)
Seven mastery guardians now exist (Python, SQL, data engineering, web, **analytics**, **spreadsheets**, **R**). The Summit requires **any three** (`requiresAnyOf`) and an open **route** (`BossDef.routes`: Data, Analytics, Spreadsheet, R; a route opens when its guardians are defeated). The player picks the route in `BossRun`; `nextVersion(save, boss, route)` offers a version of that route never attempted; a failure seals the boss until training as before; passing by any route sets `campaign.completedAt` (the campaign is still finite). Sheets and R bosses are checked by `boss.sheet.test.ts` / `boss.r.test.ts` (the analytics and Summit-analytics bosses by `boss.test.ts`).

### The Phase 6 boundary (`game/worldEvents.ts`, `content/worldEffects.ts`)
`Challenge.worldEffects` declares what the *world* should do when something is demonstrated (`target: 'vault.door'`, `action: 'open'`). `submitChallenge`/`submitBoss` emit a `worldEffect` event on the FIRST pass; `deriveWorldState(save)` rebuilds the state of every world object from the evidence log alone (identical after reload, never reads XP/level/items). A future scene subscribes to the events and reads the state; it cannot change any rule. See `docs/FUTURE_WORLDS.md`.

### Save v8
`SAVE_VERSION = 8`: `explore` (visited worlds, last world: navigation only) and Daily records/offers may carry `focus: 'mixed'`. Migration 7 → 8 adds `explore`; nothing else is touched, so evidence, lessons and quests carry over and no player is re-locked: access is computed from evidence on load.

## Phase 6 systems: the 3D world (src/play/)
**Decision: three.js** (one dependency, WebGL2, loaded as a lazy chunk the first time the 3D view opens). Considered: Babylon.js (larger, more engine than needed), raw WebGL (too much code to own), CSS 3D/Canvas 2D (cannot give a real third-person world). The classic UI stays and shares the same save; `localStorage codequest.mode` ('classic'|'3d') and `?classic` choose; no WebGL falls back to classic.

```
src/play/logic    pure, Node-testable: movement/collision, interact selection, dialogue, conditions (holds/hasEffect, per-save cached deriveWorldState),
                  travel gates (canUseExit), vehicle physics, track geometry, baseball sim, markers
src/play/engine   three.js: stage (loop, camera, load/unload scene, react to events), builders.* (procedural props per world), rig (characters),
                  tween, fx (pooled particles), audio (synth, mute), input, drive (car mode)
src/play/ui       Preact overlays on the canvas: PlayScreen (the wiring), dialogue/prompt/quest tracker, terminal (real LessonScreen), training,
                  map, daily (dispatch board), manual (Field Manual), boss, finale, sim, pause, welcome, touch controls
src/content/play  data only: scenes/*.ts (props, NPCs, interactables, exits, reactions, consequences), cast, quests, effects, stations, baseball
src/game/play.ts, quests.ts   pure actions for play state and quest state
```
**Flow.** Terminal → real lesson/challenge → `submitChallenge` (unchanged) → events. First pass: `worldEffect` → `reactions` in the scene definition map `target:action` to a prop state (animated live; applied instantly on load from `deriveWorldState(save)`). Fail: `challengeFailed` → scene `consequences` → Focus lost, required training → the Simulation Room → `ReturnPoint` back to the exact lesson. While a full-screen overlay is open the stage is suspended and events are buffered, then replayed on close. The world has no learning rules and stores only `save.play` (v9).
**Quests** (`game/quests.ts`): state is derived (unavailable/available/accepted/in-progress/completed) from the save plus quest data; only "accepted" is stored. `GameStore` exposes arrow-property methods (the original bug was destructured methods losing `this`).
**Performance rules**: shared geometries/materials (`userData.shared` are never disposed per scene); label textures cached and cleared on unload; scene disposal on travel; walls and occluders hidden rather than culling by distance; quality presets (shadows, pixel ratio) in the pause menu; per-save memoization of graph/world derivations; `describeReturn` split so the editor chunk is not in the startup bundle. Tools: `scripts/perf-probe.mjs`, `cpu-profile.mjs`, `heavy-save.ts`, `shot3d.mjs`.
**Test hooks**: with `localStorage codequest.e2e = '1'` the page exposes `window.__cq3d` (teleport, travel, autopilot for the car, dynamic prop states). Players never get it.

## Phase 6 polish pass (3D is the game)
- **3D is the only normal mode** (`play/mode.ts`; classic only via `?classic` or as the WebGL-failure fallback). Mouse look uses pointer lock (`engine/input.ts`); Esc releases it and opens the pause menu.
- **Character rig** (`engine/rig.parts.ts`, `rig.ts`): a skeleton of named joints; animation is a function of smoothed weights (idle/walk/run/air, stride follows distance), one-shot and hold gestures, talking, moods, blinking, head look. Meshes are baked into one skinned mesh per character (`skinBake`) so a person costs a few draw calls. NPCs and the player share it.
- **Cinematics** (`logic/cinematic.ts`, `engine/director.ts`, `content/play/cinematics.ts`, `ui/CinematicOverlay.tsx`): data cue sheets (camera, say, prop, fx, flash, sfx, npc, player, shake, mood, banner). The Director queues them, locks control, supports skip (state-changing cues still apply) and an instant mode for reduced motion. A world reaction, quest completion or level-up maps to a cinematic id; `deriveWorldState` restores the end state on load without playing anything.
- **Guidance** (`logic/path.ts`, `logic/objective.ts`, `engine/guide.ts`, `ui/ObjectiveWidget.tsx`): the objective comes from the quest model; a grid A* path drives an instanced chevron trail, a light column and a HUD bearing/distance. Toggle in the pause menu. It says where, never how.
- **Racing replay** (`engine/demoLap.ts`): the AI driver (`logic/vehicle.ts aiDrive`) drives a lap with the player's setup and camera cuts, so a setup change is visible.
- **Performance**: static batching (`engine/batch.ts`), shared cached geometry/materials, a 4-light pool, skinned characters. Measured draw calls: atrium 283 -> 155, bay 463 -> 230, characters in the bay 151 -> 33.
- **Limits**: all art is procedural (primitives and canvas textures, no imported models); only lessons with stations show world effects; software WebGL was the only renderer available for testing, so frame times on real GPUs were not measured here.

## Phase 6 finishing pass: flow, guidance, collision, motion
- **A pass answers itself.** While a lesson is open (`ui/TerminalOverlay`), a first pass that changes the world is turned by `PlayScreen` into a world reaction RIGHT AWAY (after a ~0.9 s beat to read "Passed"): the terminal steps aside (it stays mounted, so the lesson is exactly where it was), `stage.react()` plays the cinematic, then the lesson is handed back. No button, no errand, no NPC. A failed answer plays nothing in the world: Focus and training (unchanged) handle it. Events are ordered world change -> quest -> (level banner after the lesson closes).
- **Quests are taken up by doing the work** (`game/play.ts acceptWorkedQuests`): the first time a step of an available story quest is done, it is accepted and, if that was its last step, completed. The quest list no longer contains steps that need an NPC conversation; talking to people stays possible and optional.
- **Guidance reads the learning record, per world** (`play/logic/objective.ts`). The plaza is a place to choose (`kind: 'choose'`, no destination, no trail). In a world: a required training plan, then a review that is due (`game/retention.reviewsDue`), then the next open lesson of that world's tracks that a terminal there can open (`lessonStatus`, the same open test as `game/lessons.nextLesson`), then an in-world activity the story asks for, then "all caught up" (`free`). Leaving a world drops its objective; finishing or failing a lesson moves it on, because it is recomputed from the save. The marker over the objective, the trail, the light column and the HUD all come from this one result (`play/logic/markers.ts`).
- **Collision follows the drawn shape** (`play/engine/collide.ts`). When a prop is built, the parts of its meshes that occupy walking height (0.3-0.85 m) become the footprint: the trunk of a tree, the two legs of an archway, a whole stand. Parts that touch merge; round things get circles. Declared `solid` sizes are only the fallback (walls, doors). `AUTO_SOLID` kinds block even when a scene forgot to say so. A `solid: false` opts out. Never use `AUTO_SOLID` for a prop shaped like a ring (a fence): its parts merge into one box. Use explicit `walls` (a chain of circles: `play/logic/ballparkGeom.ts chain`).
- **World integrity tools.** `play/logic/integrity.ts` (data-only: spawns/NPCs inside solids, overlapping solids, gaps that look passable, unreachable targets) and `play/engine/integrity.ts` (real meshes against real colliders: walk-through, floating, sunken, spawn/NPC inside a mesh). `node scripts/integrity3d.mjs` loads every scene in the production build and prints the report; `node scripts/devshot.mjs --col` draws the colliders. Run both after dressing a scene.
- **Movement has weight** (`play/logic/movement.ts`): limited acceleration (brisk), quicker deceleration, a real turn when reversing, air control, the body's velocity is what it ACTUALLY did (so nothing runs on the spot against a wall), kerbs up to 0.32 m are stepped onto. NPCs are pushed out of scenery when they walk. The camera lifts above the floor and hides anything it is inside.
- **Machines move like machines** (`engine/armMotion.ts` pure + `engine/arm.ts` rig): joint-space moves on jerk-limited S-curves timed by the slowest joint's speed limit, straight-line moves for approaches, travel limits, a servo settle and mechanical holds. The repair rig and the assembly arms use it; `Dyn.busy()` plus the cinematic cue `await` make a cue sheet wait for a machine instead of guessing how long it takes.
- **Reactions have grammar and variety** (`content/play/cinematics.ts beat()`): establish, change, reaction, return, in one of four camera styles (`reveal`, `push`, `orbit`, `impact`); status screens fill in from the top; a level is a banner, not a cutscene.
- **Baseball**: `play/logic/ballparkGeom.ts` is the single source of the wall's shape; the field is one painted plane (`paintField`), the stands carry a crowd of alpha-cut busts, the player arrives on the concourse and walks the tunnel onto the field.

## Phase 6 polish pass 3: visibility, avatar, journal, cutaways, gear, data viewer
- **Camera spring arm** (`engine/stage.ts`): `camBlockers` (walls, tall props, tree crowns) shorten the camera arm; nothing is hidden during play (props and walls hide only while a cinematic camera is outside a room). Audit: `scripts/visaudit.mjs` + `window.__cq3d.visibility()` (e2e-gated).
- **Avatar**: `tech` outfit and `techpack` accessory (`engine/rig.parts.ts`); the rig blends idle, walk, run, air, acceleration lean and turn lean, with one-shot gestures (`ready swing pitch catch stretch lift throw salute work type ...`). Worn gear changes the look (`content/play/looks.ts playerLook(avatar, gear)`; `Stage.setPlayerLook` rebuilds the rig in place).
- **Quest Journal** (`game/journal.ts`, `app/components/QuestJournal.tsx`): every world, collapsible; current/available/locked/completed missions (with the reason when locked), the next step from `nextLesson`/`lessonGaps`/`requiredTraining`, and the world's skills by evidence. J opens it.
- **Cutaways** (`content/play/cutaways.ts`, `Reaction.then`, `PlayScreen`): after a reaction cinematic the player may be faded to another scene for a sheet (ballpark plays, a racing run) and returned to the exact spot. New cue kinds: `cam.follow` (ride a moving target), `lap` (run a real section of the replay lap, the sheet waits), `player.show`. `statusScreen.play('text:...')` rewrites a display (scoreboards, timing board).
- **Ballplay** (`engine/ballplay.ts`): one plate appearance beat by beat (windup, pitch, swing, contact, flight, fielders, throw, runner, crowd) for every `PlayType` plus `steal` and `predict`. `team.run('sim')` and the cutaway sequences share it. Sheets: `content/play/cinematics.baseball.ts`, `cinematics.racing.ts`.
- **Training scenes** (`play/logic/trainingKind.ts`, `training:<kind>` sheets): chosen from the owed weakness's world; `PlayScreen.goTraining` plays one and opens the console as it ends.
- **Source-data viewer** (`learning/sourceData.ts`, `DataViewer.tsx`): in every lesson step that has data; used by the lesson, demo and Daily screens (so also in the 3D terminal).
- **Gear** (`save.play.gear`, save v10; items carry `slot`/`wear`): `game/play.ts equipGear`, `buyItem` wears what it buys; the Pack tab and the in-world Bolt & Barrel kiosk (`ui/ShopOverlay.tsx`). **I** opens the Pack, **J** the Journal (the same key closes it).
- **Remarks and idles** (`content/play/hints.ts`, `play/logic/hints.ts`, `Npc3D.idles`).

## Phase 6 final polish pass: avatar arms, the plaza hub, racing reverse and lap timing
- **Rig arms** (`engine/rig.ts`): upper arm swing (±0.36 walk, ±0.7 run, forward further than back), an elbow that only flexes (more in a run, more as the hand comes forward), abduction away from the torso, a landing dip, an idle hand adjustment; airborne arms open out to the sides. `scripts/armlab.mjs` is the review tool.
- **Plaza** (`engine/builders.hub.ts`, `content/play/scenes/plaza.ts`): `hubfloor` (one painted plane: tiles, rings, a coloured lane with chevrons per district), `hubdais` + `hubcore` (the Bytehaven core), `gatehouse` x4 (themes robotics / ballpark / web / racing), `hublamp`, `datapanel`, `hubboard`, `hubskyline`; dusk lighting with one coloured light per gate; NPCs Pip and Courier Tam walk, Vera and Otto work; talk prompts follow walkers (`Stage.updateNpc`). The camera keeps out of a gatehouse's lintel (`crowns`).
- **Racing** (`play/logic/vehicle.ts`, `lapTimer.ts`, `engine/drive.ts`): `Driving.reverse` (brakes while rolling forward, reverses from a near-standstill, throttle brakes a rolling-back car), the chase camera pulls back and rises when reversing, the world edge stops the car, and the lap timer is a pure state machine on the start line's own geometry; the HUD shows "Cross the line" until it starts and the in-world timing board shows each lap.

## The Restoration Story: opening, restoration, training answers, ending
- **Restoration** (`play/logic/restoration.ts`, pure): `restoration(save, world)` = share of a world's `PLAY_EFFECTS` the player has caused (worlds by effect prefix: bay/floor = robotics, hall/ward/arena = academy, office/field = ballpark, garage = racing); `restorationTotal`; `stageOf` (offline, stirring 25%, running 50%, humming 75%, restored); `stagesReached(seen, save)` is the pure test for "a district reached a new stage"; the finished campaign restores every district.
- **The power grid** (`engine/power.ts`, owned by `Stage`): each glowing material of a loaded scene is cloned privately and registered under a district (`p.world` on a prop, `look.lights[i].world` on a lamp, '' = the scene's own); `Stage.syncPower` eases every district to its target (the player's restoration, or an override: `'*'` whole place, or one district), also dims the sky and fog (`dimSky`), scales machinery motion (`motion`, applied to dyn/tick updates) and slows the plaza core. `powerOverrides` are only ever set by loading with `power`, the `power` cue, or the sequencer; `Director.end` re-syncs. `NpcPlacement.minRestore` brings people into a scene as its district returns (Stage skips an NPC and its talk prompt until then).
- **Cue additions** (`play/logic/cinematic.ts`): `power {k|'save', over, motion, world}`, `music {name|null}`; a cue at t = 0 now fires on the first frame (the Director starts a hair before zero); a `cam` cue with blend <= 0.06 is a cut. `Director.whenIdle()` lets a sequencer wait for a sheet. `Stage.load(def, at, { power, pristine })`; `pristine` applies every scene reaction (the demo lap then runs the tuned car).
- **Sequences** (`content/play/opening.ts` data; `play/ui/sequencer.ts` plays; `PlayScreen.runStory/runEnding` own the screen state): segments are place + how it looks (`pristine`, `dark`, `power`) + the sheet; `keep` continues in the loaded place; `credits` shows the roll while its sheet plays. `OPENING` (about 85 s: the city at its best, the failure world by world, the arrival, Juno, the four worlds and what joins them, then gameplay), `ENDING` (the summit holds its breath, each world wakes from dark, the plaza lights core then lanes, credits, a last scene with the people of Bytehaven, "Bytehaven is alive again.", the end card, then the existing summary card). Credits (`ui/Credits.tsx`) list what the player did from the world's own record and the cast; `ui/EndCard.tsx` is the title. `OpeningCard` replaces the camera work under reduced motion.
- **Training answers** (`cinematics.training.ts`, props in `scenes/sim-room.ts`): on `trainingComplete` of a required plan the screen waits briefly, plays `trainwin:<kind>` (kind read when the console opened, `trainingKind`), and returns to the exact lesson with no click.
- **Smooth sequences (Opening Cinematic Polish pass).** Cause of the stutter: every cut built the next place synchronously on the main thread at the moment of the cut (70-680 ms per scene, 5.2 s for the first plaza) behind a quick black dip, so the picture froze, then jumped. Now `Stage.prepare(def, pristine)` builds the next place OFF-stage while the current shot plays (generator slices of `prepBudgetMs` = 4 ms per frame inside `Stage.frame`), compiles its shaders in parallel (`compileAsync`) and draws it once into an 8x8 render target so geometry/textures are uploaded; `Stage.load` then takes the prepared place and `activate` is a swap (2-7 ms). Label textures are generation-swept (`kit.ts`), not cleared on unload, so a place being prepared never loses its labels. `playSegments` (`ui/sequencer.ts`, host = `SeqHost` with `fade(to, ms)`) prepares the next place, dissolves to black across the last 420 ms of a sheet and back in over 720 ms (`Segment.fadeIn` overrides, first shot 1.4 s) with the swap hidden in the dark; between `keep` sheets the Director `hold`s the shot so the camera never snaps. Director camera moves are eased (smootherstep) in position, look-at and FOV (`cam.fov`); `cam` with blend <= 0.06 is still a cut; `cam 'player'` eases back to the player's own camera and then hands it over. A fresh game builds the plaza `{power:1, pristine:true}` behind the black title so the first picture is already the opening's first shot. Subtitles fade out (`CinematicOverlay` lingers 420 ms), the curtain eases in/out, the HUD fades.
- **The opening's last beat** (`opening:final`, five lines in `OPENING_LINES`): the core stutters at the end of the tour, the camera comes to the newcomer, Juno steps close, a held silence, "You're the only one who can save us.", a pause, and the camera eases into the player's own view in the offline plaza (control returns with no click). Skip and replay reuse the same fades and clean up (`cancelPrepare`, `hold(false)`).
- Tools: `scripts/openperf.mjs` (main-thread cost of the opening on a production build), `scripts/firstframe.mjs`.
- **Save v11**: `play.seen.opening`. v10 -> v11 marks existing saves; `newSave()` does not (a new game or reset plays it).
- **Plaza people**: `content/play/cast.hub.ts` (`juno-hub` and four citizens who appear as worlds return; their lines read the real record). The hub objective names the story ("Bring Bytehaven back online") and changes with total restoration.
- **Fixed on the way**: `Stage.unload` disposed nothing (it emptied the world group before traversing it) and NPC rigs were never disposed: long journeys through many places leaked GPU memory.
- Review tools: `scripts/lookshot.mjs` (a place as it was / is from a chosen camera), `scripts/sheetshot.mjs` (one sheet, photographed over time), `scripts/openshot.mjs` (the whole opening from a new game), `scripts/contact.mjs` (tile screenshots). They run on the dev server: do not edit source while a capture runs (a reload ends it).

## Security model (what is and isn't guaranteed)
Player code is untrusted and runs only inside a Web Worker running WebAssembly CPython:
- No DOM, no `localStorage`/`document.cookie` (workers don't have them), no host filesystem or OS access (Emscripten virtual FS only), no subprocess/socket access from Python itself.
- After Pyodide loads, the worker removes `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `indexedDB`, `caches`, `importScripts`, and `postMessage` from its global scope (a private reference to `postMessage` is kept). This is **best-effort hardening**: a determined player could probably find other routes, e.g. via `js` module prototypes.
- Same-origin worker: it is not a cross-origin sandbox. Hence the honest limitation: **a determined player can forge results or edit their own save.** CodeQuest is a single-player learning tool with no leaderboard or server trust; cheating only cheats the player. Don't build competitive/server-trusted features on this without a redesign (server-side grading).
- The app never uses `innerHTML` for content (RichText builds elements), never `eval`s player code on the main thread, and content strings are not HTML.
- Production builds add a Content-Security-Policy `<meta>` (see `vite.config.ts`); note meta-CSP does not apply to workers.
- **Web pages (Phase 3)** run in a sandboxed iframe with an opaque origin (`sandbox="allow-scripts"`, no `allow-same-origin`), loaded from a separate `web-sandbox.html` with its own CSP (no network, no frames, no forms, `data:` images only), private in-memory storage, a simulated `fetch`, and nonce-checked `postMessage`. It cannot read the game DOM or save. Full model, limits and the endless-loop behaviour: `docs/WEB_SANDBOX.md`.
- `harness.py` is trusted code and runs inside the same interpreter as the player's code: player code can in principle tamper with the harness's globals. Acceptable under the threat model above.

## Save data
`core/save.ts`, version **8** (Phase 5: `explore` block, daily kind `mixed`; migration 7->8 adds `explore`; v7 = Focus gate; migration 6->7 sets Focus to 100 and refunds Focus consumables; v6 added `Weakness.required`; migration 5->6 is a pass-through; Phase 4 added `training`, `bosses`, `campaign`; migration 4->5 adds empty blocks; Phase 3 added `daily: { current, history, lastSeenAt }`; migration 3->4 starts with no daily and repairs a corrupt daily block instead of rejecting the save; Phase 2 added evidence fields, migration 2->3; v1 -> fresh). Contains player profile, stats (xp, coins, focus), inventory, quests, achievements, unlocked areas, lesson progress, challenge progress (attempts, runs, hints, time, draft code, XP already awarded), one-off flags, and the full evidence log. Level is derived from XP, not stored. Migrations are a table keyed by "from version"; v1 (Phase 0 shell, no player data) → fresh; v2 → v3 adds evidence fields without losing progress (tested). A save that can't be read (corrupt or from a *newer* version) is copied to `codequest.save.backup` and never silently destroyed; the UI shows a notice.

## UI
`App.tsx` holds a `route` (map | area | lesson) and an optional journal panel; there are no URL routes. Screens: Title (character creation), WorldMap, Academy (mentor + intro dialogue + quest board + rest), TrainingGrounds (the Programming Hall: robot + Python lessons + Practice Yard), TrainingYard (the Training Grounds), TrackArea (Database District with SQL Sandbox; Data Pipeline Works), Library (notebook, Field Manual, training log), Shop, Locked/future areas, LessonScreen (steps). The journal (Hud buttons) has quests, pack, skills, trophies, menu (export/import/reset). Toasts/level-up overlay are driven by `GameEvent`s returned from actions. `prefers-reduced-motion` is honoured. Layout is responsive (single column under 900px).

## Testing layers
1. **Unit** (Vitest): save/migrations (incl. 2->3, 3->4 and corrupt saves), the Daily Challenge (timer, clock rollback, selection, one attempt, rewards, achievements, persistence), retention recommendations, progression, mastery, selection/retry, backfill, actions (XP, unlocks, quests, achievements, evidence, shop, reset).
2. **Adaptive training (unit)**: `game/training.test.ts`, `boss.test.ts`, `dailyCombo.test.ts`: diagnosis scales with evidence, fresh problems, composites, detour semantics, no Focus loss, escalation without lockout, mastery retained, guided vs independent evidence, the Training Board, boss remediation and a new version after training, the ending, save round-trips, v4 -> v5 migration and corrupt-block repair.
3. **Phase 5 layers**: `game/graph.test.ts` (gates, exact messages, cross-world paths, reachability of every area), `retention.test.ts` (spaced review and exploration), `trainingGlobal.test.ts` (training in every world), `worldEvents.test.ts`, `balance.test.ts`; content validated per runtime: `content/sheet` (engine), `content/git` (simulator), `content/r` and `content/boss/boss.r.test.ts` (real R), `content/boss/boss.sheet.test.ts`, `reference.pro.test.ts` (Field Manual examples in all four new worlds).
3b. **Content in real Python and real SQLite** (Vitest + Pyodide in Node): every challenge's starter fails, every reference solution passes, every wrong attempt fails, hints don't contain solutions, demos run, structure/mode rules, mastery requirements achievable.
4. **Web content in real Chromium** (Vitest + Playwright harness): every web challenge and web Daily: starter fails, reference solutions pass, wrong attempts fail, hints do not leak solutions, Field Manual web examples run without errors, sandbox isolation and API server unit tests.
5. **End-to-end** (`npm run e2e`): the built game in Chromium (Phase 2 adds SQL lesson flow, failing -> different-problem retry with evidence, Field Manual lookup, sandbox persistence/reset, the pipeline lesson, phone layout): character creation, mentor, map/locks, lessons, real Python errors, hints/evidence, infinite-loop handling, focus/rest, shop, save/load/export/reset, corrupt saves, a full playthrough of all lessons plus the independent trial, and a phone-width overflow check. Screenshots are written to `e2e/screenshots/`.

## Known open questions
- Exploration model (UI-driven now; canvas later if movement-based exploration is wanted).
- Git is practised in a simulator (no real `git`, so no rebase/cherry-pick/submodules yet); APIs are covered by the in-game API sandbox (real network and CORS are only documented).
- Loading curriculum payloads per track/lesson on demand (async registry) to shrink the first load.
- Future worlds and a 3D presentation layer are documented in `docs/FUTURE_WORLDS.md`.
- Cloud sync / accounts (none; export/import text only).
- Whether to move to SharedArrayBuffer-based interrupts if the host can set COOP/COEP headers (would avoid worker restarts).
