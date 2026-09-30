# CodeQuest

A long-term, browser-based educational RPG that builds **independent technical problem-solving**, not just familiarity with syntax. The goal is a player who can face an unfamiliar problem, research it, write and test code from a blank file, debug it, and ship original projects, without an AI supplying the answer.

## Learning areas
Programming fundamentals · Python · SQL & databases · data engineering (built) · JavaScript · HTML/CSS · data analysis & statistics · R · APIs · Excel · Git/GitHub · debugging · testing & verification · research · multi-technology projects.

The world is an RPG with baseball as an occasional theme; examples span engineering, manufacturing, business, finance, science, data, automation and games.

## What exists today (Phase 2)
**Phase 1 (beginner Python)** is intact: Bytehaven Academy, the Training Grounds, Bolt-7 and 14 lessons from “print” to functions, ending in an Independent Trial.

**Phase 2 adds intermediate Python, SQL, databases and data engineering** (43 lessons, 198 challenges, 33 skills):
- **Retry that teaches**: each learning objective has several authored **variants** (same idea and difficulty, different context and data). Fail, and you are offered a *different* problem; the failed attempt stays in your record. A **Practice Yard** and explainable recommendations (fresh problem after a failure, less support after a guided solve, harder after consistent independent success, an old concept in a new context) choose what to practise.
- **Intermediate Python** (lessons 15-26): lists, tuples, dicts, sets, slicing, sorting/filtering/aggregation, records, function design, debugging, files/CSV/JSON, cleaning and validating data, the standard library and documentation, writing tests, classes/composition/inheritance, multi-concept projects, and an independent trial.
- **The Database District** (SQL, real SQLite in your browser): SELECT/WHERE/ORDER BY/LIMIT, NULL, aggregates, GROUP BY/HAVING, joins, CASE, INSERT/UPDATE/DELETE, subqueries/CTEs, window functions, schema design, normalisation, constraints, indexes, transactions and a trial. Queries are graded by **result or resulting database state on visible and hidden data**, never by comparing text; designs are judged structurally. A persistent **SQL Sandbox** lets you experiment (and reset).
- **The Data Pipeline Works**: ingest, validate, clean, load, ETL vs ELT, idempotent loads, isolating bad rows, and combining Python with SQL (`sqlite3`, parameterised queries, analysis in Python), plus an independent trial.
- **Field Manual and the 10-step method**: searchable documentation and a process for problems you do not know how to solve. Lookups are recorded as research evidence.
- **Story**: NPCs (Architect Vex, Engineer Ori, Analyst Sana, Dr. Pell) and quests *The Ledger Vault*, *The Database District* and *Keep the Pipeline Running*.
- **Honest evidence**: mastery per skill is categorical and computed only from demonstrated, independent, varied performance (distinct challenges, objectives and contexts); XP, levels, quests and achievements are pacing only and there is no numeric mastery score.

## Core ideas
- **Real code execution.** Behaviour is tested; any valid solution passes.
- **Progression ≠ mastery.** XP/levels pace the game; mastery is computed from demonstrated independent performance (`src/learning/mastery.ts`). There is deliberately no numeric “mastery score”.
- **Guided → independent.** Learning mode → challenge mode → independent mode.
- **Content is data**, so the curriculum can grow without rewriting the engine.

## Run it
Requires Node 20+ (developed on Node 22).

```
npm install        # also copies the Python runtime into public/pyodide/
npm run dev        # dev server at http://localhost:5173
npm test           # unit tests + every challenge validated in real Python
npm run typecheck
npm run build      # production build to dist/ (static files; works from any path, offline after first load)
npm run e2e        # build + drive the real game in Chromium (needs a Chromium; set CHROMIUM_PATH if not found)
```
Python is downloaded/started the first time you open a coding screen (a few seconds; ~13MB, cached by the browser).

## Docs
- [CLAUDE.md](CLAUDE.md): permanent rules and philosophy (for Claude Code sessions and contributors)
- [ARCHITECTURE.md](ARCHITECTURE.md): technical design, security model, data flow
- [PROGRESS.md](PROGRESS.md): what's built, what isn't, known issues, roadmap

## Development approach
Incremental phases in this one repository. Each phase preserves earlier functionality and updates the docs.
