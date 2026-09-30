# CLAUDE.md — Permanent rules for CodeQuest

Read this first in every session, then `PROGRESS.md` (current state) and `ARCHITECTURE.md` (how it fits together).

## What this project is
CodeQuest is a long-term, browser-based educational RPG. Its goal is NOT to teach syntax trivia; it is to take a player from beginner knowledge to **independently solving unfamiliar technical problems**: writing code from a blank file, debugging, working with data and databases, building web apps, using APIs, analyzing information, researching unfamiliar technologies, testing/verifying their work, and creating original projects **without relying on AI to hand them the solution**.

Target skills (eventually): programming fundamentals, Python, SQL/databases, JavaScript, HTML, CSS, data analysis, statistics, R, APIs, Excel, Git/GitHub, debugging, testing, research, problem solving, multi-technology projects.

Baseball is a recurring *theme* and source of examples, never the limit of the curriculum. Examples and challenges must also draw on engineering, software, business, finance, healthcare, manufacturing, research, and other technical fields so skills transfer.

## Project principles (non-negotiable)
1. This repo is the permanent home of CodeQuest. No separate repos/projects per phase.
2. Development is incremental, in phases. Preserve existing functionality unless there is a strong technical reason to change it (and record the reason in PROGRESS.md).
3. Avoid over-engineering. Build what the current phase needs; don't add speculative abstractions.
4. No giant monolithic files. Keep modules small and single-purpose.
5. A future developer (or Claude session) with no conversation history must be able to understand the project from the docs and code.
6. Prefer **real code execution** (tests run against the player's code) over string-matching expected answers.
7. **XP, levels, quests, achievements, and progression are NEVER proof of mastery.** They are pacing/engagement. Mastery is computed only from `EvidenceRecord`s of demonstrated performance, weighted by independence (see `src/learning/mastery.ts`). Never gate "mastered" status on XP or completion counts.
8. Guidance must fade: early content is guided; later content gives blank files, no hints, unfamiliar contexts, and open-ended projects. Using hints/solutions must lower the evidence strength recorded.
9. Curriculum is **data** (`src/content/`), separate from engine code, so content can grow long-term without rewriting systems. The game must not require regenerating curriculum every few days.
10. Do not build the five curriculum phases or bulk placeholder content ahead of the phase that calls for them.

## Educational design rules (learned building Phase 1: keep them)
- Every challenge is verified by **behaviour** (checks on output / variables / function results, plus AST constraints when a construct is the point). Never compare the player's source text to one "right answer". Accept every valid implementation.
- Each challenge needs **hidden edge cases** (boundaries such as `>=` vs `>`, negatives, zero, "the only difference between two wrong ideas") so hard-coding or off-by-one solutions fail. Content tests exist to catch weak checks: add wrong attempts to `solutions.testdata.ts` for any plausible misconception.
- Hints go conceptual → specific → strong, and **never contain the full solution**. Feedback names the *thinking* to do; it must not print the answer. Hidden checks only reveal that a hidden case failed.
- Teach a concept only when the next task needs it. Each lesson: explain → runnable demo (player must run it) → guided practice (learning) → less-guided challenge(s) (challenge mode). Introduce real errors on purpose (debugging is a core skill).
- Use varied real-world contexts (engineering, manufacturing, business, finance, science, data, automation, games); baseball is occasional flavour (content test caps it).
- **Independent mode must not name the language constructs, functions, algorithms, libraries, or steps.** Later phases should make the independent tier more open-ended and add unfamiliar-technology (transfer) problems.
- Be honest in the UI: learning-mode passes are recorded as *guided*, never "independent". Never label XP/level/achievements/quest completion as skill. The shop must never sell answers, hints, or evidence.
- Never use `innerHTML` for content; never `eval` player code on the main thread.

## Educational design rules added in Phase 2 (keep them)
- **Variants, not repeats**: every objective that matters has 2+ variants (`objectiveId`) with the same language/skills/concepts/difficulty and DIFFERENT contexts and data. A retry offers a different problem; failures are never erased (evidence keeps `priorFailures`). Success on a retry is never automatic mastery.
- **Mastery needs variety**: skill requirements ask for independent passes across distinct challenges, objectives AND contexts. `content.test.ts` proves shipped content can satisfy them. Never show a numeric mastery score.
- **Hidden data**: SQL/Python data checks must run on a hidden twin database (`x-b`) or alternate fixture so hard-coded answers fail. Check `sqlSchema`/`sqlPlan`/`sqlState` for design, performance and DML tasks instead of comparing text.
- **Every wrong attempt is a test**: for each challenge add plausible misconceptions to the `solutions*.testdata.ts` files; if a wrong attempt passes, the check is weak: strengthen the check, not the wrong attempt.
- **Docs are practice**: new documentation goes in the Field Manual (`content/reference.ts`) with an executable example; independent challenges may need tools never taught. Never make the Field Manual print a full solution.
- Sandboxes (SQL Sandbox) never write evidence and never touch the game save.

## Educational design rules added in Phase 3 (keep them)
- **Web code is graded in a real browser**, never by comparing source text: structure (DOM/semantics/a11y), computed styles and geometry at several viewport widths, behaviour driven through real events, and timing on a virtual clock. Hidden checks and a hidden API data set (`api: 'b'`) defeat hard-coding. Player HTML/CSS/JS only ever runs in the sandboxed iframe (`allow-scripts`, no `allow-same-origin`); see `docs/WEB_SANDBOX.md`. Never loosen that sandbox or give player code the host page.
- **Independent web tasks** give a brief and, at most, the page skeleton (the ids the checks need). They do not name JavaScript constructs, DOM APIs, `fetch`, `localStorage` or timer functions. Documentation for tools never taught lives in the Field Manual (`content/reference.web.ts`, every entry has a runnable page executed in Chromium by `web.test.ts`).
- **Daily Challenge** (`game/daily*.ts`, `content/daily/`): ONE attempt, NO hints, NO retry, NO solution reveal; rewards (coins, XP, Focus, cosmetics) only on a solve and never affecting mastery; the 12-hour timer is persisted and cannot be gamed by moving the clock back; missing a day costs nothing and there is no streak pressure. Selection is deterministic and explainable (see ARCHITECTURE.md). Dailies are independent-style: no concepts, hidden checks, required lessons that exist.
- **Retention is explained, never scored**: reviews are suggested when a learned skill has been quiet for a week and always say why. Nothing hidden, no numeric score.
- **A wrong attempt that passes is either a weak check or an equivalent solution.** Strengthen the check (or the data, e.g. deliberate boundary rows in the API/SQL data sets) if it is a real misconception; delete the attempt if it is genuinely equivalent.
- The web/API **check helpers** (`h.*`) are part of the content contract: changing `sandboxRuntime.js` can change every check. Re-run `npx vitest run src/content/web` after touching it.

## Development guidelines
- Stack: Vite + TypeScript (strict) + Preact + CodeMirror 6 + Pyodide + Vitest (+ playwright-core for e2e). See ARCHITECTURE.md.
- Commands: `npm run dev`, `npm run typecheck`, `npm test`, `npm run build`, `npm run e2e` (builds, generates `e2e/.fixtures.json`, serves, drives real Chromium; `E2E_ONLY=<substring>` runs matching tests only, e.g. `E2E_ONLY=Daily node e2e/run.mjs` against an existing build). All of typecheck, test, build and e2e should pass before finishing a phase. Web content tests need a Chromium (`CHROMIUM_PATH`, or `/opt/pw-browsers`); run one challenge with `npx vitest run src/content/web -t "<challenge id>"`.
- `npm install` runs `scripts/copy-pyodide.mjs` (copies the Python runtime into gitignored `public/pyodide/`). If Python fails to load in dev, run `node scripts/copy-pyodide.mjs`.
- Game rules go in `src/game/` as **pure functions** returning `{ save, events }`; UI never mutates saves. Curriculum goes in `src/content/` as data. Learning-engine code goes in `src/learning/`.
- Save data is versioned (`src/core/save.ts`). Any change to saved shape MUST bump `SAVE_VERSION` and add a migration so existing player progress is never lost; add a migration test.
- Adding a lesson: new file in `src/content/<area>/`, register in `src/content/index.ts`, add reference solutions **and wrong attempts** to `solutions.testdata.ts`; `npm test` validates it in real Python. Update quest objectives/unlock rules in `content/world.ts` if needed.
- Adding a SQL/data lesson: files in `src/content/sql/` or `src/content/dataeng/`, register in `content/index.ts`, add solutions to `sql/solutions.testdata.ts` or `python/solutions.phase2.testdata.ts`, and add any new database (plus its `-b` hidden twin) to `content/databases/`.
- Adding a web lesson: `src/content/web/NN-*.ts` (see `docs/WEB_SANDBOX.md`), register in `content/index.ts`, reference solutions AND wrong attempts in `content/web/solutions*.ts`. Adding a Daily: `content/daily/` (+ `solutions*.testdata.ts`). Attaching extra variants to an old lesson: `content/python/variants-phase3.ts` (appended by `content/index.ts`).
- Adding a language: a new `CodeRunner` in `src/learning/<lang>/` (see `runner.ts`); do not special-case the UI.
- Add tests for logic. Keep e2e for behaviour that only a real browser can prove.
- Match surrounding style; comments explain *why*. Keep dependencies few and justify new ones in ARCHITECTURE.md.
- At the end of every work session update `PROGRESS.md` (completed / incomplete / known issues) and `ARCHITECTURE.md` if structure changed. Document significant schema changes.
- Work on the branch the session instructs; don't open or merge PRs unless asked.
- Only proceed into a new phase when the user asks. Do not pre-build later phases' content.
