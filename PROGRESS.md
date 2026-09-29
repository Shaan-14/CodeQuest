# PROGRESS.md

_Last updated: Phase 0 (foundation)._

## Current phase
**Phase 0 — Foundation: COMPLETE.** Phase 1 has not been started; wait for explicit instruction.

## Completed
- Documentation: CLAUDE.md, README.md, ARCHITECTURE.md, PROGRESS.md.
- Tooling: Vite + TypeScript (strict) + Preact + Vitest; scripts `dev`, `build`, `typecheck`, `test`.
- `src/core/save.ts`: versioned localStorage save layer with migration hook and corrupt-data fallback (3 unit tests).
- `src/learning/mastery.ts`: mastery evidence types (types only).
- `src/learning/runner.ts`: `CodeRunner` interface (types only).
- `src/content/schema.ts`: `Skill` / `Challenge` types (types only).
- Minimal app shell (`src/app/App.tsx`) proving render + save persistence.

## Verified
- `npm run typecheck`, `npm test` (3 passing), `npm run build` all succeed.
- Dev server serves the app; headless Chromium rendered the shell DOM correctly.

## Not built yet (nothing below exists)
- RPG world, story, characters, dialogue, maps, UI screens
- Any code-execution backend (JS, Python/Pyodide, SQL, R)
- Code editor component
- Mastery calculation logic, XP/levels/achievements
- Any curriculum content; content validation tooling
- Save export/import; CI; deployment

## Known issues / notes
- `launches` in `SaveData` is a placeholder for the shell check; remove once real state exists (bump `SAVE_VERSION`).
- Package versions were latest at install time (e.g. TypeScript 7, Vite 8, Vitest 5); lockfile is committed.
- Bundlers for WASM runtimes (Pyodide etc.) are untested; expect to lazy-load from CDN or self-host.

## Future phases (proposed; order adjustable)
1. **Phase 1 — Playable core loop:** RPG shell UI, code editor, JavaScript runner in a sandbox, first challenge format with real test execution, evidence recording, basic mastery view separate from XP.
2. Programming fundamentals + Python (Pyodide runner), fading guidance.
3. SQL & databases (SQLite-WASM).
4. Web: HTML/CSS/JavaScript projects.
5. Data analysis, statistics, R, Excel, APIs.
6. Git/GitHub, testing, research skills; capstone independent projects and mastery assessments (no-hint, unfamiliar-context).
