# PROGRESS.md

_Last updated: end of Phase 2._

## Current phase
**Phase 2 (intermediate Python, SQL & databases, data engineering, retry/variant system): COMPLETE.** Phase 3 has not been started; wait for explicit instruction.
(Phases 0 and 1 are preserved: same repo, same architecture. Save format v1 → v2 → v3, migrations tested; Phase 1 saves load unchanged and gain the new evidence fields.)

## What Phase 2 built
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
- **Unit + content** (`npm test`, Vitest): save/migration v1→v2→v3/corruption, progression, mastery, selection/retry/alternate-selection/difficulty preservation, backfill, all game actions incl. XP/Focus/coins/quests/achievements/unlock rules/story order, sandbox storage; **every one of the 198 challenges validated in real Python/SQLite**: starter fails, valid and alternate valid solutions pass, plausible wrong attempts fail, hints do not leak solutions, demos run, hidden twin data present, reference queries non-empty, mode rules, variants share concepts/difficulty with distinct contexts, mastery requirements achievable; Field Manual examples executed; engine tests for Python fixtures/files/tests-check, SQL result/state/schema/plan/script checks, DB reset/persistence, Python + SQL integration.
- **End-to-end in real Chromium** (`npm run e2e`): all 16 Phase 1 scenarios plus Phase 2: locks and reasons for the new areas, SQL demo showing a real result table, a full SQL lesson, failing a SQL challenge → different problem → both attempts in evidence (with `priorFailures` and the retry achievement), Field Manual search + recorded lookup, sandbox persistence across reload and reset (no evidence written), a Python + database pipeline lesson, phone-width overflow on the new screens. Screenshots in `e2e/screenshots/`.

**Final results (end of Phase 2):** typecheck clean; `npm test` 1443 passed in 12 files (1,300 of them real Python/SQLite content checks); production build OK; `npm run e2e` **22 of 22 passed** against the production build (16 Phase 1 + 6 Phase 2). Bugs found and fixed while testing this phase: weak hidden checks (strengthened with distinguishing data), a check-level hidden database colliding with the challenge database (now replaces by alias), the e2e `run` helper not recognising SQL results, and Phase 1 e2e assertions updated for the renamed Database District and save v3.

## Known limitations / issues
- **Not tamper-proof** (unchanged): same-origin worker; a determined player can forge results or edit their save. Fine for single-player.
- The SQL/Python graders share one worker and interpreter with the harness (documented). Infinite loops still cost a worker restart; runaway SQL is stopped by a progress handler.
- Bundle is now ~900KB JS (~284KB gzip) because all 198 challenges and databases are bundled; content should be code-split/lazy-loaded per area in a later phase.
- Only Python and SQLite are runnable. No JavaScript/HTML/R runners yet. SQL is SQLite 3.39 (dialect differences from PostgreSQL/MySQL are noted only where they matter, e.g. no built-in median).
- Independent evidence is still limited: 8 independent challenges. Mastery requirements are data (`content/skills.ts`) and modest for some skills; raise them as more independent/transfer problems are added.
- Practice recommendations are simple, explainable rules, not a full adaptive engine; they never consider time-of-day or spaced-repetition scheduling.
- Database designs are judged structurally (keys, foreign keys, required tables, no copied names); a design can pass while being poor in ways the rules do not detect. The pipeline "simulations" are code tasks, not a visual pipeline editor.
- Story/NPC dialogue is short and progress-driven, not branching. Art is CSS/SVG/emoji only; no audio.
- Routing is in-memory (reload returns to the Academy; progress kept). Accessibility is basic.
- The variant picker only chooses among authored variants: 54 objectives still have a single variant.

## Recommended Phase 3 priorities
1. **The web (Web Workshop)**: HTML/CSS/JavaScript runners in a sandboxed iframe, DOM/behaviour checks, then APIs/fetch against a safe in-game API sandbox; reuse the variant/evidence/fixtures machinery unchanged.
2. Code-split content and databases per area; lazy-load runtimes.
3. More independent and transfer problems across Phases 1-2 (raise mastery requirements accordingly); more variants for single-variant objectives.
4. Spaced-review scheduling on top of `recommendPractice`; a "review my weak spots" flow.
5. Richer pipeline tasks (multi-file/multi-stage runs with logs) and a visual pipeline view; SQL design feedback explaining *why* a schema is weak.
6. Then analysis/statistics/R/Excel (Phase 4) and Git/research/open projects (Phase 5).

