# PROGRESS.md

_Last updated: end of Phase 1._

## Current phase
**Phase 1 (playable core loop + Python foundations): COMPLETE.** Phase 2 has not been started; wait for explicit instruction.
(Phase 0, the foundation shell, is complete and preserved: same repo, same architecture, save format migrated v1 → v2.)

## What Phase 1 built
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
- **Unit** (save/migration/corruption, progression, mastery, all game actions) and **real-Python content validation** (every challenge: starter fails, valid solutions pass, wrong attempts fail, hints don't leak solutions, demos run, mode rules, mastery requirements achievable).
- **End-to-end in real Chromium** (`npm run e2e`): startup, character creation, mentor, map and locks, lesson flow, real Python output and errors, failing then passing submissions, hints and evidence, hint-free replay, infinite loop and output flood handling, Focus exhaustion/rest, shop/pack, save/reload persistence, export/import/reset, corrupt save, independent trial has no hints/named tools, the skills view shows no XP, a full playthrough of all lessons, and no horizontal overflow at phone width. Screenshots were reviewed by hand.

**Final results (end of Phase 1):** typecheck clean; `npm test` 261 passed in 6 files (incl. 198 real-Python content checks); production build OK (~490KB JS, gzip 166KB, plus the lazily loaded Python runtime); `npm run e2e` 16 of 16 passed against the production build (with CSP): full playthrough finished at Level 7, 2303 XP, 32 evidence records.
During testing the e2e run found and fixed: a missing favicon (404), an untruthful message that called learning-mode passes "independent" evidence (now "guided"), the Focus warning being hidden below a sticky footer, and tall sticky bars on phones.

## Known limitations / issues
- **Not tamper-proof**: player code shares an origin with the game; a determined player can forge results or edit their save. Fine for a single-player tool; needs server-side grading for any competitive/trusted feature. (ARCHITECTURE.md, Security model.)
- Infinite loops are stopped by **terminating and restarting the worker** (a few seconds). SharedArrayBuffer interrupts would need COOP/COEP headers.
- First Python start downloads/compiles ~13MB of WebAssembly (cached afterwards). The app shows "Starting Python…".
- `input()` is fed from a text box, not interactively in the console.
- Mastery requirements are deliberately modest for beginner skills (some need only 1–2 independent solves). They are data in `content/skills.ts` and should be raised as content grows. Independent evidence today comes from challenge mode plus one Independent Trial; Phase 2+ needs many more independent/transfer problems.
- Only Python is runnable. Only one Independent Trial exists.
- Routing is in-memory: reloading returns to the Academy screen (progress is kept). No deep links.
- Accessibility is basic (semantic buttons, labels, focus outlines, reduced motion); no full screen-reader audit.
- Bundle: ~490KB JS (CodeMirror), plus lazily-loaded Python. Not yet code-split.
- `harness.py` and player code share one Python interpreter (documented; acceptable under the threat model).
- Art is CSS/SVG/emoji only; no audio.

## Remaining work / roadmap (proposed, order adjustable)
- **Phase 2: Python in depth + testing/debugging discipline**: lists, tuples, dicts, strings in depth, files/CSV, modules, exceptions, writing tests for your own code, debugging harder programs, more challenge- and independent-mode problems per skill, first "unfamiliar problem" (transfer) tasks, a real adaptive layer built on `detectPatterns`.
- **Phase 3: SQL & databases (Data Center)**: SQLite-WASM runner, new `Check` kinds (query result sets), schema design, joins, aggregation.
- **Phase 4: The web (Web Workshop)**: HTML/CSS/JavaScript runners (sandboxed iframe), APIs and fetch (with a safe API sandbox).
- **Phase 5: Data analysis, statistics, R, Excel; Git/GitHub; research skills; capstone projects** (Analytics Observatory, The Summit), with open-ended, multi-technology projects and mastery assessments (no hints, unfamiliar context).
- Cross-cutting: more independent problems and "research" scaffolding (finding and reading docs), project-style graded tasks, save cloud sync or richer backup, code-splitting, accessibility audit, more world content/art/audio.

## What Phase 2 should build first
1. More evidence: 2–3 additional challenge-mode and one independent problem for each Phase 1 skill (so "demonstrated" is harder to reach by accident), and raise requirements accordingly.
2. Lists/dicts/loops-over-data lessons in the same content format, quest 2 ("The Data Vault" or similar) in the Academy story.
3. First adaptive behaviour: use `detectPatterns` to suggest a review lesson or a harder challenge, visible and explainable to the player.
4. A test-writing skill: challenges where the player writes tests (checks) for a given function and the game runs them against correct and buggy implementations.
