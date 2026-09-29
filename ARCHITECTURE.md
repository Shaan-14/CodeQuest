# ARCHITECTURE.md

How CodeQuest is built as of **Phase 1**. Read `CLAUDE.md` first for the rules; this file explains the structure and why.

## Stack and why
| Choice | Reason |
|---|---|
| **Vite + TypeScript (strict)** | Static build, no backend. Types protect the content schema, save data and runner contract over a long project. |
| **Preact** | Panel-heavy UI (editor, quest log, dialogue) suits components; ~4KB, React-like API. No router or state library: screens are plain state and game state is one store. |
| **CodeMirror 6** | Real editor (highlighting, line numbers, undo, indentation) at reasonable size. **Autocomplete is deliberately not installed** so the editor never suggests solutions. |
| **Pyodide (CPython 3.14 → WebAssembly)** | Real Python in the browser: real output, real tracebacks, real semantics. Self-hosted (see below). |
| **Vitest** | Unit tests, including tests that run real Python (Pyodide in Node). |
| **playwright-core** (dev only) | End-to-end tests of the built game in a real Chromium (`npm run e2e`). |
| **localStorage** | Enough for single-player saves; storage is injected so it can be swapped. Export/import text backup exists. |

Not chosen (add only when a phase needs it): a game engine, a router, a global state library, a backend, an autocompleting editor.

## Layout
```
index.html, vite.config.ts, tsconfig.json
scripts/copy-pyodide.mjs   copies the Pyodide runtime from node_modules → public/pyodide (gitignored, ~14MB)
e2e/run.mjs                real-browser end-to-end tests (+ screenshots to e2e/screenshots, gitignored)
src/
  main.tsx                 mounts <App/>
  core/save.ts             SaveData (v2), migrations, load/write/export/import
  learning/                the learning ENGINE (language-agnostic contracts + Python implementation)
    runner.ts              CodeRunner interface: run() and grade()
    mastery.ts             EvidenceRecord, SupportLevel, summarizeSkill, detectPatterns
    python/harness.py      Python-side runner/grader (executed inside Pyodide)
    python/pythonEngine.ts glue: harness ⇄ JSON, works with any loaded Pyodide (browser worker OR Node tests)
    python/pythonWorker.ts Web Worker that loads Pyodide and hosts the engine
    python/PythonRunner.ts main-thread controller: worker lifecycle, timeouts (kill + restart)
    python/runner.ts       shared singleton
  content/                 curriculum and world DATA (no game logic)
    schema.ts              types: Lesson, Challenge, Check, Constraint, Skill, Area, Quest, Item...
    index.ts               registry: lessons in teaching order, lookups by id
    python/NN-*.ts         one file per lesson (lesson + its challenges)
    python/solutions.testdata.ts  TEST-ONLY reference solutions/wrong attempts (never imported by the app)
    skills.ts, world.ts, mentor.ts, avatars.ts, helpers.ts
  game/                    PURE game rules on SaveData (no UI, no storage)
    actions.ts             every state transition: (save, …) → { save, events }
    progression.ts         XP curve, levels, rewards (independent of mastery)
    achievements.ts, world.ts (unlock rules), lessons.ts (status helpers), events.ts
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

## Security model (what is and isn't guaranteed)
Player code is untrusted and runs only inside a Web Worker running WebAssembly CPython:
- No DOM, no `localStorage`/`document.cookie` (workers don't have them), no host filesystem or OS access (Emscripten virtual FS only), no subprocess/socket access from Python itself.
- After Pyodide loads, the worker removes `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `indexedDB`, `caches`, `importScripts`, and `postMessage` from its global scope (a private reference to `postMessage` is kept). This is **best-effort hardening**: a determined player could probably find other routes, e.g. via `js` module prototypes.
- Same-origin worker: it is not a cross-origin sandbox. Hence the honest limitation: **a determined player can forge results or edit their own save.** CodeQuest is a single-player learning tool with no leaderboard or server trust; cheating only cheats the player. Don't build competitive/server-trusted features on this without a redesign (server-side grading).
- The app never uses `innerHTML` for content (RichText builds elements), never `eval`s player code on the main thread, and content strings are not HTML.
- Production builds add a Content-Security-Policy `<meta>` (see `vite.config.ts`); note meta-CSP does not apply to workers.
- `harness.py` is trusted code and runs inside the same interpreter as the player's code: player code can in principle tamper with the harness's globals. Acceptable under the threat model above.

## Save data
`core/save.ts`, version **2**. Contains player profile, stats (xp, coins, focus), inventory, quests, achievements, unlocked areas, lesson progress, challenge progress (attempts, runs, hints, time, draft code, XP already awarded), one-off flags, and the full evidence log. Level is derived from XP, not stored. Migrations are a table keyed by "from version"; v1 (Phase 0 shell, no player data) → fresh v2. A save that can't be read (corrupt or from a *newer* version) is copied to `codequest.save.backup` and never silently destroyed; the UI shows a notice.

## UI
`App.tsx` holds a `route` (map | area | lesson) and an optional journal panel; there are no URL routes. Screens: Title (character creation), WorldMap, Academy (mentor + intro dialogue + quest board + rest), TrainingGrounds (robot + lesson list), Library (notebook + training log), Shop, Locked/future areas, LessonScreen (steps). The journal (Hud buttons) has quests, pack, skills, trophies, menu (export/import/reset). Toasts/level-up overlay are driven by `GameEvent`s returned from actions. `prefers-reduced-motion` is honoured. Layout is responsive (single column under 900px).

## Testing layers
1. **Unit** (Vitest): save/migrations, progression, mastery, actions (XP, unlocks, evidence, shop, reset).
2. **Content in real Python** (Vitest + Pyodide in Node): every challenge's starter fails, every reference solution passes, every wrong attempt fails, hints don't contain solutions, demos run, structure/mode rules, mastery requirements achievable.
3. **End-to-end** (`npm run e2e`): the built game in Chromium: character creation, mentor, map/locks, lessons, real Python errors, hints/evidence, infinite-loop handling, focus/rest, shop, save/load/export/reset, corrupt saves, a full playthrough of all lessons plus the independent trial, and a phone-width overflow check. Screenshots are written to `e2e/screenshots/`.

## Known open questions
- Exploration model (UI-driven now; canvas later if movement-based exploration is wanted).
- How Git/API skills will be practised (simulated services vs real ones; CORS; in-browser git).
- Cloud sync / accounts (none; export/import text only).
- Whether to move to SharedArrayBuffer-based interrupts if the host can set COOP/COEP headers (would avoid worker restarts).
