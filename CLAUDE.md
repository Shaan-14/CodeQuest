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

## Development guidelines
- Stack: Vite + TypeScript (strict) + Preact + Vitest. See ARCHITECTURE.md for justification.
- Commands: `npm run dev`, `npm run typecheck`, `npm test`, `npm run build`. All of typecheck, test, and build must pass before committing.
- Save data is versioned (`src/core/save.ts`). Any change to saved shape MUST bump `SAVE_VERSION` and add a migration so existing player progress is never lost.
- Add tests for logic (save/migrations, mastery calculation, answer checking, content validation). UI shell code needs less testing.
- Match surrounding code style; keep comments to the *why*.
- Player code must run isolated (Web Worker / sandboxed iframe), never via `eval` on the main page.
- Keep dependencies few; justify each new one in ARCHITECTURE.md.
- At the end of every work session update `PROGRESS.md` (completed / incomplete / known issues) and `ARCHITECTURE.md` if structure changed.
- Work on the branch the session instructs; don't open PRs unless asked.
- Only proceed into a new phase when the user asks.
