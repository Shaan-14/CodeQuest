# CodeQuest

A long-term, browser-based educational RPG that builds **independent technical problem-solving**, not just familiarity with syntax. The goal is a player who can face an unfamiliar problem, research it, write and test code from a blank file, debug it, and ship original projects, without an AI supplying the answer.

## Learning areas
Programming fundamentals · Python · SQL & databases · **data engineering (deepened in Phase 4)** · **HTML · CSS · JavaScript · the DOM · APIs (built in Phase 3)** · data analysis & statistics · R · Excel · Git/GitHub · debugging · testing & verification · research · multi-technology projects.

The world is an RPG with baseball as an occasional theme; examples span engineering, manufacturing, business, finance, science, data, automation and games.

## What exists today (Phase 4)
**Phase 4 makes the game adaptive, deeper and finite** (94 lessons, 424 challenges, 60 skills, 52 Daily Challenges, 8 bosses): *you do not redo old lessons; you train the weakness, prove improvement, and return to where you were.*
- **Adaptive training.** When your evidence shows trouble (a failure, a hint, skills that fail only together, a skill gone quiet) the game diagnoses *what* and offers a training plan sized to it: a small refresher after a slip, reinforcement plus a fresh problem plus an independent attempt after a hint, a longer path for a real gap. Training is a **detour**: your lessons, quests and unlocks never move, it costs no Focus, there is no lockout, and it returns you to the exact step you left. Training and retries always use **different problems, contexts and data**.
- **Mastery is never erased.** A later mistake adds a note to your history; it never removes what you demonstrated. The Skills view shows earlier independent performance next to recent trouble, and skills used **together** (loops + dictionaries, files + dictionaries, API + JSON + errors, …). The **Training Board** lists what to work on, in order, with the reason.
- **Bosses and an ending.** Three gate guardians, four mastery trials (Python, SQL, data engineering, web) and the **Summit Trial**: unfamiliar problems, no hints, no starter, one attempt each. Fail one and you get a diagnosis and training, then a **new version**, never the same problem. The Summit Trial ends the campaign (the story of the Great Outage).
- **Deeper curriculum**: data engineering grew from 3 to 9 lessons (validation, data quality, logging, failing safely, incremental loads, reporting); Python +6 (text, nested data, searching/sorting with measured efficiency, custom exceptions, parsing, learning from documentation); SQL +5 (dates and text, self-joins and sets, debugging queries, investigations, migrations); web +5 (closures, writing tests, CSS positioning, rendering from state, web addresses). See [docs/CURRICULUM_AUDIT.md](docs/CURRICULUM_AUDIT.md).
- **Daily Challenges** now often combine an older skill with what you are learning, and prefer combinations you have found tricky.

## Phase 3 (still here)
**Phase 3 adds the web, a Daily Challenge and a stronger memory of what you have learned** (72 lessons, 348 challenges, 46 skills, 52 Daily Challenges, 33 independent trials):
- **The Web District**: 26 lessons from a first HTML page to complete web apps: semantic HTML and accessibility, forms, CSS selectors/cascade/box model/flexbox/grid/responsive design, JavaScript, the DOM and events, validation, `localStorage` and JSON, timers/promises/async, `fetch` and HTTP against a safe **in-game API** (methods, status codes, auth, retries, rate limits). Your HTML/CSS/JS runs in a **sandboxed iframe** and is graded in the browser by what it actually does (structure, computed styles at several screen widths, real clicks and typing, virtual time, hidden API data). Quests: *Build the Web*, *Style the City*, *Bring It to Life*, *The Interactive Dashboard*, *The API Gate*, *The Web Workshop*.
- **Daily Challenge** (🌅 in the HUD): one problem every 12 hours, chosen from what you are learning now and what you learned earlier (a skill you mastered can return as a hard review), with the reason shown. **One attempt, no hints, no retry.** Rewards only on success and never touch your skill record; missing a day costs nothing.
- **Retention**: skills you have not practised for a week are flagged with the number of days and a review problem is suggested, with its reason; a skill you only solved in one setting is offered in a new one. No hidden score.
- **More real independence**: independent review trials on older Python and SQL skills, independent web trials, 20 web dailies, and extra variants so a retry is a genuinely different problem.
- **Field Manual** now covers HTML, CSS, JavaScript, the DOM, events, `fetch`, JSON, HTTP, the in-game API, browser debugging, accessibility and web-security basics; every example runs in real Chromium in the tests.
- Future worlds (Baseball, Racing, an original Magical Academy) and a possible 3D layer are **documented only**: [docs/FUTURE_WORLDS.md](docs/FUTURE_WORLDS.md).

## Phase 2 (still here)
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
Requires Node 20+ (developed on Node 22). The web content tests and `npm run e2e` need a Chromium (found automatically under `/opt/pw-browsers`, or set `CHROMIUM_PATH`).

```
npm install        # also copies the Python runtime into public/pyodide/
npm run dev        # dev server at http://localhost:5173
npm test           # unit tests + every challenge validated in real Python/SQLite and real Chromium
npm run typecheck
npm run build      # production build to dist/ (static files; works from any path, offline after first load)
npm run e2e        # build + drive the real game in Chromium (needs a Chromium; set CHROMIUM_PATH if not found)
```
Python is downloaded/started the first time you open a coding screen (a few seconds; ~13MB, cached by the browser).

## Docs
- [CLAUDE.md](CLAUDE.md): permanent rules and philosophy (for Claude Code sessions and contributors)
- [ARCHITECTURE.md](ARCHITECTURE.md): technical design, security model, data flow
- [PROGRESS.md](PROGRESS.md): what's built, what isn't, known issues, roadmap
- [docs/WEB_SANDBOX.md](docs/WEB_SANDBOX.md): the web sandbox, the in-game API and their security model
- [docs/CURRICULUM_AUDIT.md](docs/CURRICULUM_AUDIT.md): what the curriculum lacked, what Phase 4 added, known gaps
- [docs/FUTURE_WORLDS.md](docs/FUTURE_WORLDS.md): the roadmap of worlds and the future 3D layer (design notes only)

## Development approach
Incremental phases in this one repository. Each phase preserves earlier functionality and updates the docs.
