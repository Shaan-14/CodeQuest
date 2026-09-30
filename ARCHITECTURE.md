# ARCHITECTURE.md

How CodeQuest is built as of **Phase 3**. Read `CLAUDE.md` first for the rules; this file explains the structure and why.

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
  core/save.ts             SaveData (v5), migrations, load/write/export/import
  learning/                the learning ENGINE (language-agnostic contracts + Python implementation)
    runner.ts              CodeRunner interface: run() and grade()
    mastery.ts             EvidenceRecord, SupportLevel, summarizeSkill, unmetRequirements, detectPatterns
    python/harness.py      Python+SQL runner/grader (executed inside Pyodide): workspace fixtures, all check kinds
    python/pythonEngine.ts glue: harness ⇄ JSON, works with any loaded Pyodide (browser worker OR Node tests)
    python/pythonWorker.ts Web Worker that loads Pyodide and hosts the engine
    python/PythonRunner.ts main-thread controller: worker lifecycle, timeouts (kill + restart)
    python/runner.ts       shared singleton
    web/                   the WEB runner: WebRunner.ts (host), sandboxRuntime.js + sandboxPage.ts (the sandboxed page), apiServer.js/apiData.ts (in-game API), testHarness.ts (Playwright, tests only)
  content/                 curriculum and world DATA (no game logic)
    schema.ts              types: Lesson, Challenge, Check (incl. WebCheck), Constraint, Skill, Area, Quest, Item, DailyMeta...
    index.ts               registry: lessons in teaching order, lookups by id
    python/NN-*.ts         one file per Python lesson (lesson + its challenges + variants)
    sql/NN-*.ts            SQL lessons 01-14 (Database District)
    dataeng/NN-*.ts        data-engineering lessons (Data Pipeline Works)
    databases/             the game's SQLite databases as data (deterministic seeded generators) + hidden twins
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
    daily.ts, dailySelect.ts, retention.ts   the Daily Challenge, its deterministic selection, and retention memory
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
`core/save.ts`, version **7** (Focus gate; migration 6->7 sets Focus to 100 and refunds Focus consumables; v6 added `Weakness.required`; migration 5->6 is a pass-through; Phase 4 added `training`, `bosses`, `campaign`; migration 4->5 adds empty blocks; Phase 3 added `daily: { current, history, lastSeenAt }`; migration 3->4 starts with no daily and repairs a corrupt daily block instead of rejecting the save; Phase 2 added evidence fields, migration 2->3; v1 -> fresh). Contains player profile, stats (xp, coins, focus), inventory, quests, achievements, unlocked areas, lesson progress, challenge progress (attempts, runs, hints, time, draft code, XP already awarded), one-off flags, and the full evidence log. Level is derived from XP, not stored. Migrations are a table keyed by "from version"; v1 (Phase 0 shell, no player data) → fresh; v2 → v3 adds evidence fields without losing progress (tested). A save that can't be read (corrupt or from a *newer* version) is copied to `codequest.save.backup` and never silently destroyed; the UI shows a notice.

## UI
`App.tsx` holds a `route` (map | area | lesson) and an optional journal panel; there are no URL routes. Screens: Title (character creation), WorldMap, Academy (mentor + intro dialogue + quest board + rest), TrainingGrounds (the Programming Hall: robot + Python lessons + Practice Yard), TrainingYard (the Training Grounds), TrackArea (Database District with SQL Sandbox; Data Pipeline Works), Library (notebook, Field Manual, training log), Shop, Locked/future areas, LessonScreen (steps). The journal (Hud buttons) has quests, pack, skills, trophies, menu (export/import/reset). Toasts/level-up overlay are driven by `GameEvent`s returned from actions. `prefers-reduced-motion` is honoured. Layout is responsive (single column under 900px).

## Testing layers
1. **Unit** (Vitest): save/migrations (incl. 2->3, 3->4 and corrupt saves), the Daily Challenge (timer, clock rollback, selection, one attempt, rewards, achievements, persistence), retention recommendations, progression, mastery, selection/retry, backfill, actions (XP, unlocks, quests, achievements, evidence, shop, reset).
2. **Adaptive training (unit)**: `game/training.test.ts`, `boss.test.ts`, `dailyCombo.test.ts`: diagnosis scales with evidence, fresh problems, composites, detour semantics, no Focus loss, escalation without lockout, mastery retained, guided vs independent evidence, the Training Board, boss remediation and a new version after training, the ending, save round-trips, v4 -> v5 migration and corrupt-block repair.
3. **Content in real Python and real SQLite** (Vitest + Pyodide in Node): every challenge's starter fails, every reference solution passes, every wrong attempt fails, hints don't contain solutions, demos run, structure/mode rules, mastery requirements achievable.
4. **Web content in real Chromium** (Vitest + Playwright harness): every web challenge and web Daily: starter fails, reference solutions pass, wrong attempts fail, hints do not leak solutions, Field Manual web examples run without errors, sandbox isolation and API server unit tests.
5. **End-to-end** (`npm run e2e`): the built game in Chromium (Phase 2 adds SQL lesson flow, failing -> different-problem retry with evidence, Field Manual lookup, sandbox persistence/reset, the pipeline lesson, phone layout): character creation, mentor, map/locks, lessons, real Python errors, hints/evidence, infinite-loop handling, focus/rest, shop, save/load/export/reset, corrupt saves, a full playthrough of all lessons plus the independent trial, and a phone-width overflow check. Screenshots are written to `e2e/screenshots/`.

## Known open questions
- Exploration model (UI-driven now; canvas later if movement-based exploration is wanted).
- How Git skills will be practised (in-browser git simulation). APIs are covered by the in-game API sandbox (real network and CORS are only documented).
- Loading curriculum payloads per track/lesson on demand (async registry) to shrink the first load.
- Future worlds and a 3D presentation layer are documented in `docs/FUTURE_WORLDS.md`.
- Cloud sync / accounts (none; export/import text only).
- Whether to move to SharedArrayBuffer-based interrupts if the host can set COOP/COEP headers (would avoid worker restarts).
