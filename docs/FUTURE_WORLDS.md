# Future worlds and the 3D presentation layer

**Status: design notes plus one built boundary.** Phases 3-5 deliberately did not build 3D, Baseball World, Racing World, the robot/engineering yard, an API district or the original magic academy; they make sure the architecture can carry them. Phase 5 built the *event contract* between learning and any visual world (below); no renderer exists. Build a world only when the user asks for that phase.

## The roadmap of worlds
CodeQuest's long-term map is a set of *worlds* (areas with their own theme, NPCs and quests). Each one is a **presentation** of curriculum that already lives in `src/content/`; a world never owns curriculum.

| # | World | Status | What it teaches (curriculum it presents) |
|---|---|---|---|
| 1 | **Bytehaven Academy** | built | the hub; mentor; Daily Challenge; shop entry |
| 2 | **Training Grounds** | built (Phase 1-2) | Python from first program to projects, review trials |
| 3 | **Database District** | built (Phase 2) | SQL, database design, integrity, performance |
| 4 | **Data Pipeline Works** | built (Phase 2) | ETL/ELT, idempotent loads, Python + SQL |
| 5 | **Web District** | built (Phase 3) | HTML, CSS, JavaScript, forms, storage, async, fetch/APIs, complete apps |
| 6 | **Analytics Observatory, R Laboratory, Spreadsheet Guild, Version Vault** | built as learning worlds (Phase 5), presentation still 2D | statistics, R, spreadsheets, Git |
| 7 | **Engineering / Manufacturing World** | planned | simulation, control logic, sensors, quality, scripting for automation |
| 8 | **Baseball World** | planned | sports analytics: data, SQL, statistics, visualisation, APIs, using baseball as *context* |
| 9 | **Racing World** | planned | telemetry, time series, optimisation, real-time data, simulation |
| 10 | **Original Magical Academy** | planned | a fantasy school (see below) presenting the same skills as spells/lessons/duels |
| 11 | **Final / Summit World** | planned | open-ended multi-technology projects with no map provided; Git/GitHub, research, testing at scale |

Baseball is a *theme and a source of examples* (CLAUDE.md), never the limit of the curriculum: Baseball World is a place to practise the same skills on sports data; it must not become the only place where those skills appear.

### Baseball World
A ballpark that doubles as a data centre: batting records are SQL tables, the scoreboard is a web page, the pitching machine is an API. Challenges reuse existing objectives with baseball contexts (statistics, window functions over seasons, JSON scouting reports, a live scoreboard using the in-game API sandbox). Difficulty comes from data, not from theme.

### Racing World
Telemetry as data: lap times, sector splits, tyre wear. Emphasis on time series, aggregation, real-time updates (timers/promises/API polling from Phase 3), and optimisation problems ("choose a pit strategy"). A track view can be a 3D presentation of the same lap data the learner is analysing.

### Original Magical Academy
An **original** fantasy school (not a copy of, and not derived from, any existing franchise: no borrowed names, characters, spells, houses, artefacts, plot or visual identity; the inspiration is only the general idea "a school where you learn a craft with mentors, rivals and exams"). Suggested original identity: a school whose "magic" is literacy in systems: spells are programs, wards are tests, potions are data transformations, familiars are services. Houses/tracks map to skill areas (data, web, systems, research). Duels are *time-limited independent challenges*; exams are Independent Trials; the school year is the curriculum spine. Everything a learner does there is graded by the same engine.

## The 3D presentation layer (future)
A 3D layer is **only a renderer and controller**. It must not contain, duplicate or fork any of these, all of which stay in the current 2D-agnostic modules:

| Concern | Lives in (and stays there) |
|---|---|
| Curriculum (lessons, challenges, variants, hints, Field Manual) | `src/content/` (data) |
| Grading (behaviour checks, hidden data, real execution) | `src/learning/` (Pyodide/SQLite runners, web sandbox) |
| Evidence and mastery | `src/learning/mastery.ts`, `save.evidence` |
| Rules: XP, coins, Focus, unlocks, quests, achievements, Daily Challenge | `src/game/` (pure functions returning `{ save, events }`) |
| Save data | `src/core/save.ts` (versioned; a 3D layer adds NO new authority over it) |

### Contract a 3D layer would consume
1. **World description**: `areas`, `npcs`, `quests` from `src/content/world.ts` / `npcs.ts` (positions are percentages today; a 3D world adds its own scene data keyed by `area.id`, not fields on the curriculum).
2. **State**: read-only `SaveData` via the store, and *actions* only through `game/actions` and `game/daily` (the same functions the 2D UI calls). The 3D layer never writes the save directly.
3. **Challenges**: when the player walks up to a station, the layer opens the same `ChallengeStep`/`DailyRun` UI (or its data contract: challenge id, starter, prompt, runner, `submitChallenge(save, id, passed, timeMs, code)`), so grading, evidence, hint accounting and rewards are identical.
4. **Events**: the `events` array returned by every action (`level-up`, `quest-complete`, `achievement`, ...) is the only stream a scene needs to animate rewards.
5. **Daily Challenge**: shown by the same `DailyCard`/`refreshDaily` logic (one attempt, no hints, rewards only on success); a 3D "daily board" just presents it.

### Rules for any future world or 3D work
- Progression is never proof of mastery (CLAUDE.md #7): a world may show XP/levels for fun, never as skill.
- No world sells hints, answers or evidence. Cosmetics only.
- A world must be playable from the same save as every other world: unlocks are data rules (`Area.lock`), not scene logic.
- New curriculum still goes through the normal pipeline (data + validated solutions + wrong attempts + hidden checks); a world is not an excuse to skip it.
- 3D assets load lazily and never block the 2D game; the 2D UI stays fully functional (accessibility, low-end devices, phone layout).
- Keep the layer swappable: a `WorldPresenter`-style interface (`enterArea`, `showChallenge`, `playEvents`) is enough; do not build it until a 3D world is actually requested.

## What Phase 5 built for future worlds: the world-effect contract
```
code  ->  graded evidence  ->  worldEffect event  ->  derived WorldState  ->  (Phase 6) scene / animation
```
- **Declared in data.** `Challenge.worldEffects` (attached by `content/worldEffects.ts`) names `target` (`area.object`, e.g. `vault.door`) and `action` (one verb, e.g. `open`). A lesson's effects follow a pass of its final challenge; a boss's effects follow defeating it (every Summit route lights the same `summit.beacon`).
- **Emitted, never drawn.** `submitChallenge` and `submitBoss` push a `worldEffect` `GameEvent` on the FIRST pass only (`game/worldEvents.ts`). Toasts show a neutral line today; a scene would play an animation.
- **Derived, never stored.** `deriveWorldState(save)` folds the evidence log into `{ target -> { actions, last, sources } }`. It is identical after a reload, needs no save field, and never reads XP, level, coins or items: the world reflects what the player can DO.
- **Theme-neutral.** Targets are abstract (`academy.robot`, `lab.board`, `guild.ledger`). A robot yard, an **original** magic academy (no borrowed names, spells, houses or visuals), an API district or a race track maps the same targets to its own objects. Changing theme changes no rule, challenge or saved data.
- **Also ready for it**: worlds are data (`content/worlds.ts`), access is one graph (`game/graph.ts`), `ReturnPoint` covers where a scene sends the player back to, `explore` remembers worlds visited. A scene would subscribe to events, read `WorldState`, and call the same actions as the 2D UI.
- **Examples only, not built**: a robot/engineering world (Git and R challenges as maintenance and telemetry), the magic-academy (spells = programs, wards = tests, duels = time-limited independent challenges, all graded by the existing engine), API/baseball (the in-game API as a scoreboard), racing (telemetry and time series).

## What Phase 4 added for future worlds
- **A finite campaign spine.** `content/campaign.ts` defines acts, each closed by a boss (`content/bosses.ts`); the Summit Trial ends the story. A future world adds an *act* (story text + the boss that closes it) and an *area* (`Area.lock` rule) without touching the learning engine; it may also add its own mastery boss whose versions live in `content/boss/`.
- **World-agnostic adaptive training.** The learning engine (`learning/`, `game/diagnosis.ts`, `game/training*.ts`, `game/boss.ts`) knows only skills, challenges, evidence, weaknesses and return points (`ReturnPoint { kind: 'lesson' | 'area' | 'boss' | 'daily' | 'map' }`). A world's job is to *present* a training plan or a boss (a 3D arena is just another renderer for `TrainingRun`/`BossRun`); it never decides what to train. A world that wants its own return place adds a `ReturnPoint` kind and a handler in the UI, nothing else.
- **Contexts as flavour.** Each challenge carries a `context`; a Baseball, Racing or Engineering world re-skins problems by contributing new *variants* (same skills, same difficulty, new context and data) to existing objectives, which the training and boss selectors already prefer ("different context").

## What Phase 3 did to prepare
- Curriculum, grading and rules are already independent of the UI (pure `game/` functions; content as data).
- Areas are data with lock rules; the Web District was added purely by data plus a route.
- Challenges/dailies are addressed by id and graded by runner-agnostic checks, so a scene can open any of them.
