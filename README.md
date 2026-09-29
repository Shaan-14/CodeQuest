# CodeQuest

A long-term, browser-based educational RPG that builds **independent technical problem-solving**, not just familiarity with syntax. The goal is a player who can face an unfamiliar problem, research it, write and test code from a blank file, debug it, and ship original projects, without an AI supplying the answer.

## Learning areas (planned)
Programming fundamentals · Python · SQL & databases · JavaScript · HTML/CSS · data analysis & statistics · R · APIs · Excel · Git/GitHub · debugging · testing & verification · research · multi-technology projects.

The world is an RPG with baseball as an occasional theme; examples span engineering, manufacturing, business, finance, science, data, automation and games.

## What exists today (Phase 1)
A playable beginner experience:
- **RPG world**: Bytehaven Academy (Mentor Juno, quest board, rest), Training Grounds (the broken robot Bolt-7), Great Library (notebook + honest "Training Log"), Shop, and locked future areas (Data Center, Web Workshop, Analytics Observatory, The Summit).
- **Character**: name, avatar, level, XP, Focus (health-like resource), coins, inventory, quest log, achievements, saved in your browser.
- **Python from zero**, taught in 14 short lessons through the quest **“Wake the Training Robot”**: print, errors and debugging, variables, strings, numbers and operators, input and conversion, booleans and comparisons, if/elif/else, while, for/range, functions, and a final control program. Each lesson: explain → run a demo → guided practice → challenges with less help. Ends with an **Independent Trial**: a problem with no hints, no starter code and no named tools.
- **Real Python** runs in your browser (Pyodide/WebAssembly in a Web Worker), with real output and real error messages. Challenges are graded by **running your code against tests** (including hidden edge cases), not by matching text.
- **Progressive hints** that cost reward and are recorded, and **evidence-based mastery**: XP and levels are just progress; skills are only marked “demonstrated” after independent, hint-free solves across several challenges.

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
