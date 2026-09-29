# ARCHITECTURE.md

## Stack and why
| Choice | Reason |
|---|---|
| **Vite** | Fast dev server and static build; no backend needed. Output is plain static files deployable anywhere. |
| **TypeScript (strict)** | The project will be large and long-lived; types protect content schemas, save data, and the runner contract. |
| **Preact** | The UI will be panel-heavy (editor, quest log, inventory, dialogue). A small component library (~4KB) beats hand-rolled DOM code, with a React-compatible API. |
| **Vitest** | Same config as Vite; tests for logic (saves, mastery, content validation). |
| **localStorage** (for now) | Sufficient for single-player saves. Storage is injected, so IndexedDB/export-import can replace it later. |

Deliberately NOT chosen yet: a game engine (Phaser etc.), a router, global state library, backend. Add when a phase needs them and record here. The RPG world starts as UI-driven (dialogue, maps as panels); a canvas/engine can be adopted later if movement-based exploration is needed.

## Current structure
```
index.html            entry HTML
vite.config.ts        Vite + Vitest config
tsconfig.json         strict TS config (Preact JSX)
src/
  main.tsx            mounts <App/>
  app/                UI shell (App.tsx, styles.css). Later: screens/components.
  core/               game-agnostic infrastructure. save.ts = versioned, injectable storage.
  learning/           the learning system
    mastery.ts        EvidenceRecord + SupportLevel types (mastery model; types only)
    runner.ts         CodeRunner interface for real code execution (interface only)
  content/            curriculum DATA (schema.ts = Skill/Challenge types; no content yet)
```

## How parts interact (intended)
```
content (data) ──► app (UI) ──► learning/runner ──► execution sandbox
                        │                                │ results
                        ▼                                ▼
                   core/save ◄── learning/mastery (evidence records)
```
- The UI loads challenges from `content`, sends the player's code to a `CodeRunner`, and gets a `RunResult`.
- Test outcomes plus how much support the player used become an `EvidenceRecord`, persisted through `core/save`.
- Mastery for a skill is derived from evidence only. XP/level (engagement) will live separately and never feed mastery.

## Key design decisions
1. **Content/engine separation.** Curriculum is typed data validated by tests; engine code contains no lesson text.
2. **Evidence-based mastery.** Records capture `support` level and whether code was actually `executed`, so independent, executed, transfer-context passes count most.
3. **Planned execution backends** (all sandboxed in Web Workers/iframes, behind the one `CodeRunner` interface): JavaScript (iframe/worker), Python via Pyodide, SQL via SQLite-WASM (sql.js), R via webR (if practical), HTML/CSS via sandboxed iframe DOM checks. Backends are lazy-loaded (large WASM) and none exist yet.
4. **Versioned saves with migrations** so players never lose progress across phases.
5. **Static, offline-capable app**: no server required, which keeps hosting and long-term maintenance simple.

## Known open questions
- Exploration model (UI-driven vs canvas) — decide in the RPG-shell phase.
- Whether Git/GitHub and API skills are practiced against simulated services or real ones (needs CORS-friendly public APIs / an in-browser git implementation).
- Save export/import and possible cloud sync.
