# CodeQuest

A long-term, browser-based educational RPG that builds **independent technical problem-solving**, not just familiarity with syntax. The goal is a player who can face an unfamiliar problem, research it, write and test code from a blank file, debug it, and ship original projects — without an AI supplying the answer.

## Learning areas (planned)
Programming fundamentals · Python · SQL & databases · JavaScript · HTML/CSS · data analysis & statistics · R · APIs · Excel · Git/GitHub · debugging · testing & verification · research · multi-technology projects.

The world is an RPG/adventure with baseball as a recurring theme, but examples span engineering, software, data, business, finance, healthcare, manufacturing, research, and more.

## Core ideas
- **Real code execution** where practical: player code is run against tests, not compared to a expected string.
- **Progression ≠ mastery.** XP and levels are pacing only. Mastery is measured from demonstrated, independent performance.
- **Guided → independent.** Scaffolding fades over the course of the game.
- **Content is data**, so the curriculum can grow without rewriting the engine.

## Status
Phase 0 (foundation) complete: docs, tooling, and a minimal app shell. No gameplay yet. See [PROGRESS.md](PROGRESS.md).

## Run it
Requires Node 20+.

```
npm install
npm run dev        # dev server at http://localhost:5173
npm test           # unit tests
npm run typecheck
npm run build      # production build to dist/
```

## Docs
- [CLAUDE.md](CLAUDE.md) — permanent rules and philosophy (for Claude Code sessions and contributors)
- [ARCHITECTURE.md](ARCHITECTURE.md) — technical design
- [PROGRESS.md](PROGRESS.md) — what's built, what isn't, roadmap

## Development approach
Incremental phases in this one repository. Each phase preserves earlier functionality and updates the docs.
