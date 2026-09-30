/**
 * Curriculum content schema. Content is DATA (typed objects in src/content/<area>/), never
 * hardcoded in UI components. The learning engine, UI and mastery system only depend on
 * these types, so new languages/lessons are added by adding data (and, for a new language,
 * a CodeRunner implementation — see src/learning/runner.ts).
 *
 * Phase 2 changes vs Phase 1 (all additive; Phase 1 content is unchanged):
 *  - `Objective` + `Challenge.objectiveId`: several authored VARIANTS can test one learning objective.
 *  - New check kinds (files, scripts, test-writing, SQL result/state/script/schema/plan), `Fixtures`
 *    (virtual files and SQLite databases available to the player's code), and SQL constraints.
 *  - Mastery requirements can require variety (`distinctObjectives`, `distinctContexts`).
 *
 * Phase 1 changes vs Phase 0: `Challenge.tests: {name, code}[]` was replaced by declarative
 * `checks` + `constraints` (behavioural, language-agnostic descriptions that a runner
 * evaluates), and `Lesson`, `Quest`, `Item`, `Area` etc. were added.
 */
import type { Language } from '../learning/runner';
import type { CellValue, ChartSpec, WorkbookData } from '../learning/sheet/types';
import type { RepoSnapshot } from '../learning/git/types';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/**
 * How much scaffolding a challenge gives. Reduces from learning -> challenge -> independent.
 *  - learning: explanation, guided steps, expected behaviour shown, strong hints, scaffolded starter code
 *  - challenge: goal + expected behaviour only; hints available but cost evidence strength
 *  - independent: a problem description only. No concepts named, no language/function/algorithm
 *    named, no hints, blank editor. Meant to be solved from research + prior knowledge.
 */
export type LearningMode = 'learning' | 'challenge' | 'independent';

/* ------------------------------------------------------------------ behaviour checks */

/** What exists in the player's working directory while their code runs. */
export interface Fixtures {
  /** Virtual files (text) created before the run, e.g. a CSV to clean. Path -> content. */
  files?: Record<string, string>;
  /**
   * Database ids (content/databases) materialised as SQLite files `<id>.db`, e.g. 'works' -> works.db.
   * `id:alias` saves database `id` as `<alias>.db`, so a HIDDEN twin can stand in under the visible name
   * ('works-b:works' -> works.db holding the hidden data).
   */
  databases?: string[];
}

interface CheckBase extends Fixtures {
  /** Short label for the result list. Must not leak the solution. */
  name: string;
  /** Visible checks show expected vs actual on failure; hidden checks only say they failed. Default true. */
  visible?: boolean;
  /** Authored nudge shown when this check fails. Should point at the thinking, not give the answer. */
  feedback?: string;
}

/** Run the whole program with the given stdin lines; compare what it prints. */
export interface OutputCheck extends CheckBase {
  kind: 'output';
  stdin?: string[];
  expect: string;
  ignoreCase?: boolean;
}

/** Run the program, then compare the value of a top-level variable. */
export interface VariableCheck extends CheckBase {
  kind: 'variable';
  variable: string;
  expect: Json;
  /** Absolute tolerance for numbers. */
  approx?: number;
}

/** Run the program, then call a function the player defined and compare its return value and/or output. */
export interface CallCheck extends CheckBase {
  kind: 'call';
  fn: string;
  args: Json[];
  /** Lines for input() calls made by the player's top-level code while the file loads. */
  stdin?: string[];
  /** Expected return value. Omit if only `expectStdout` matters. */
  expect?: Json;
  expectStdout?: string;
  approx?: number;
}

/** Run the program, then compare a file it wrote (text; or parsed JSON when `json` is set). */
export interface FileCheck extends CheckBase {
  kind: 'file';
  path: string;
  expect: string;
  json?: boolean;
  stdin?: string[];
}

/**
 * Run the program, then run authored Python in the player's namespace. The check passes if the
 * script finishes without raising. `assert cond, "message"` messages are shown on failure, so keep
 * them as nudges about the thinking, not the answer. Used for classes, data structures, sqlite3 work...
 */
export interface ScriptCheck extends CheckBase {
  kind: 'script';
  code: string;
  stdin?: string[];
}

/**
 * The player WRITES TESTS. Their `test_*` functions are run against a correct implementation
 * (all must pass) and against each buggy implementation (each must be caught by at least one failing
 * test). The implementation under test is injected into the player's namespace under its own name.
 */
export interface TestsCheck extends CheckBase {
  kind: 'tests';
  correct: string;
  buggy: { name: string; code: string }[];
  /** Minimum number of test_ functions the player must define. */
  minTests?: number;
}

/**
 * A check on a web project (language 'web'). `script` is the body of an async function run INSIDE the sandbox
 * page after the player's HTML/CSS/JS has loaded, with a helper object `h` (see learning/web/sandboxRuntime.js):
 * `h.$ h.$$ h.text h.style h.click h.type h.submit h.settle h.tick h.assert h.eq h.logs h.errors h.storage h.api
 * h.files ...`. It passes if it finishes without throwing; assertion messages are nudges about the thinking.
 * Time is virtual (`h.tick(ms)`), so async and timer behaviour is deterministic.
 */
export interface WebCheck extends CheckBase {
  kind: 'web';
  script: string;
  /** Emulated viewport for responsive checks (media queries evaluate against it). Default 1024 x 768. */
  viewport?: { width: number; height?: number };
  /** Which dataset the in-game API serves: 'a' (default, the one the player sees) or 'b' (hidden twin). */
  api?: 'a' | 'b';
  /** True if uncaught JavaScript errors should not automatically fail this check. */
  errorsOk?: boolean;
  /** localStorage contents present BEFORE the page's scripts run (to test that saved state is restored on load). */
  storage?: Record<string, string>;
}

export type PythonCheck = OutputCheck | VariableCheck | CallCheck | FileCheck | ScriptCheck | TestsCheck;

/* ---- SQL checks (language 'sql'). Results are computed by real SQLite; expectations are usually a
 * REFERENCE QUERY run on the same database, so every valid query passes and no result is hand-typed. */

interface SqlBase {
  name: string;
  visible?: boolean;
  feedback?: string;
  /** Database id (content/databases). Use a hidden twin (e.g. 'works-b') to defeat hard-coded answers. */
  db?: string;
}

/** Compare the player's final result set with the result of `expectQuery`. */
export interface SqlResultCheck extends SqlBase {
  kind: 'sqlResult';
  expectQuery: string;
  /** Row order matters (ORDER BY tasks). Default false (compare as a multiset). */
  ordered?: boolean;
  /** 'count' (default): same number of columns. 'names': column names must match too. 'ignore': values only. */
  columns?: 'count' | 'names' | 'ignore';
  approx?: number;
}

/** After the player's script runs, run `verify` on their database and on a database where `reference` was applied. */
export interface SqlStateCheck extends SqlBase {
  kind: 'sqlState';
  reference: string;
  verify: string;
  ordered?: boolean;
}

/** After the player's script, run `script` in the same database. Passes if it errors/succeeds as expected. */
export interface SqlScriptCheck extends SqlBase {
  kind: 'sqlScript';
  script: string;
  expectError?: boolean;
}

export type SchemaRule =
  | { rule: 'minTables'; n: number; message: string }
  | { rule: 'hasPrimaryKeys'; message: string }
  /** Some table whose name matches `pattern` (regex, case-insensitive). */
  | { rule: 'tableLike'; pattern: string; message: string }
  /** The table matching `table` has a column matching `pattern`. */
  | { rule: 'columnLike'; table: string; pattern: string; message: string }
  /** A foreign key from a table matching `from` to a table matching `to`. */
  | { rule: 'foreignKey'; from: string; to: string; message: string }
  /** The table matching `table` has at least one of: NOT NULL, UNIQUE, CHECK, or a foreign key beyond its PK. */
  | { rule: 'hasConstraint'; table: string; message: string }
  /** No table has a column matching `pattern` (e.g. repeated comma-separated lists, name1/name2). */
  | { rule: 'noColumnLike'; pattern: string; message: string };

/** Run the player's script on an EMPTY database, then inspect the resulting schema structurally. */
export interface SqlSchemaCheck extends SqlBase {
  kind: 'sqlSchema';
  rules: SchemaRule[];
}

/** After the player's script, `EXPLAIN QUERY PLAN <query>` must match `mustMatch` (e.g. an index is used). */
export interface SqlPlanCheck extends SqlBase {
  kind: 'sqlPlan';
  query: string;
  mustMatch: string;
  mustNotMatch?: string;
}

export type SqlCheck = SqlResultCheck | SqlStateCheck | SqlScriptCheck | SqlSchemaCheck | SqlPlanCheck;

/* ---- spreadsheet checks (language 'sheet'; see learning/sheet/grade.ts) */
interface SheetCheckBase {
  name: string;
  visible?: boolean;
  feedback?: string;
  /** Sheet the check reads (default: the workbook's active sheet). */
  sheet?: string;
  /** Replace input cells before computing: a formula that only works for the visible numbers fails. `Sheet!A1` or `A1`. */
  with?: Record<string, CellValue>;
}
export type SheetCheck =
  | (SheetCheckBase & { kind: 'cell'; cell: string; expect: CellValue | null; approx?: number })
  | (SheetCheckBase & { kind: 'cells'; expect: Record<string, CellValue | null>; approx?: number })
  | (SheetCheckBase & { kind: 'formula'; cell: string; matches?: string; hint?: string })
  | (SheetCheckBase & { kind: 'noErrors' })
  | (SheetCheckBase & { kind: 'pivot'; index?: number; expect: (string | number)[][] })
  | (SheetCheckBase & { kind: 'chart'; index?: number; type?: ChartSpec['type']; types?: ChartSpec['type'][]; categories?: string; series?: string[]; hint?: string });

/** What a spreadsheet challenge gives the player. */
export interface SheetSpec {
  /** The workbook the player starts from (input data plus any starter formulas). */
  start: WorkbookData;
  /** Cells/ranges the player may edit (`B2:B10`, `Summary!A1`); everything else is locked so the data cannot be changed. Omit to allow every cell. */
  editable?: string[];
  /** Offer the pivot-table builder / chart builder. */
  pivot?: boolean;
  chart?: boolean;
}

/* ---- git checks (language 'git'; see learning/git/grade.ts): the player's commands are replayed, the repository STATE is graded */
export interface GitBranchExpect {
  files?: Record<string, string | { includes?: string[]; excludes?: string[] } | null>;
  commits?: number;
  minCommits?: number;
  /** Regexes; each must match the message of some commit reachable from the branch. */
  messages?: string[];
}
export interface GitExpect {
  branch?: string;
  branches?: string[];
  noBranches?: string[];
  clean?: boolean;
  noMergeInProgress?: boolean;
  /** Content of the latest commit (HEAD). `null` = the file must not exist. */
  files?: Record<string, string | { includes?: string[]; excludes?: string[] } | null>;
  /** Content of the very FIRST commit in the current history. */
  rootFiles?: Record<string, string | { includes?: string[]; excludes?: string[] } | null>;
  /** Content of the working files. */
  working?: Record<string, string | { includes?: string[]; excludes?: string[] } | null>;
  onBranch?: Record<string, GitBranchExpect>;
  merged?: { branch: string; into: string }[];
  notMerged?: { branch: string; into: string }[];
  mergeCommitOn?: string;
  noMergeCommitOn?: string;
  noConflictMarkers?: boolean;
  tags?: string[];
  /** Tags that must point at the current HEAD commit. */
  tagAtHead?: string[];
  /** The player made no ordinary (non-merge) commit while `branch` was checked out: work went through another branch. */
  noDirectCommitsOn?: string;
  /** Every commit the player made has a message that says what changed (`'required'`: and they must make at least one). */
  meaningfulMessages?: boolean | 'required';
  /** Branch -> `true` (pushed), `'synced'` (origin equals local) or `false` (must NOT be on origin). */
  remote?: Record<string, boolean | 'synced'>;
  prs?: { count?: number; onlyNew?: boolean; after?: number; any?: { head?: string; base?: string; state?: 'open' | 'merged' | 'closed'; title?: string; reviewed?: boolean }[] };
  /** Regexes over the typed commands: one must match each of `used`, none may match `notUsed`. */
  used?: string[];
  notUsed?: string[];
  headMessage?: string;
  headParents?: number;
  commitCount?: number;
}
export interface GitCheck { kind: 'git'; name: string; visible?: boolean; feedback?: string; expect: GitExpect }

/** What a Git challenge gives the player: a starting repository (see learning/git/types.ts). */
export interface GitSpec { start: RepoSnapshot }

export type Check = PythonCheck | SqlCheck | WebCheck | SheetCheck | GitCheck;

/** Structural rule on the player's source, so a loop lesson cannot be passed by copy-pasting print(). */
export interface Constraint {
  type: 'requires' | 'forbids';
  /**
   * A Python AST node class name ('For', 'While', 'If', 'FunctionDef', 'ClassDef', ...),
   * 'call:<name>' for a call to a builtin/function/method, 'import:<module>' for an import,
   * or 'sql:<regex>' for SQL text (case-insensitive, comments and string literals removed).
   */
  node: string;
  message: string;
}

/* ------------------------------------------------------------------ challenges & lessons */

/** Extra metadata for challenges authored specifically for the Daily Challenge (see content/daily). */
/** The three files of a web project. */
export interface WebFiles {
  html: string;
  css: string;
  js: string;
}

export interface DailyMeta {
  /** Which kind of day this suits: reinforcing current learning, reviewing an older skill, or either. */
  focus: 'current' | 'review' | 'either';
  /** Lessons that must be complete first, so a daily never needs a concept the player was not taught. */
  requires: string[];
}

/**
 * Structured metadata that lets the diagnosis engine (game/diagnosis.ts) find the SMALLEST meaningful weakness
 * behind a failure, instead of blaming "the whole lesson". Everything is optional: when absent, the first entry of
 * `skillIds` is primary and the rest are supporting (see content/diagnostics.ts).
 */
export interface ChallengeDiagnostics {
  /** Skills this challenge is mainly about. */
  primary?: string[];
  /** Skills that are needed but not the point (e.g. a loop inside a dictionary problem). */
  supporting?: string[];
  /** Skills that must already be solid (prerequisite concepts). */
  prerequisites?: string[];
  /** Composite competency ids (content/composites.ts) this challenge exercises, beyond those implied by skillIds. */
  composites?: string[];
  /**
   * Which skills a FAILED check points at. Keys are case-insensitive substrings of the check's name (or `constraint`
   * for a failed structural constraint); values are skill ids. A failure matching no key falls back to `primary`.
   */
  checkSkills?: Record<string, string[]>;
  /** Named common mistakes: `when` is a substring of a failed check's name; used to describe the mistake to the player. */
  mistakes?: { id: string; when: string; label: string; skills?: string[] }[];
}

export interface Challenge {
  id: string;
  /**
   * The learning objective this challenge tests. Challenges sharing an `objectiveId` are VARIANTS:
   * same concepts, mode, difficulty and skills, but a different context/structure/inputs, so retrying
   * cannot be beaten by memorising one answer. Defaults to the challenge's own id (see objectiveOf).
   */
  objectiveId?: string;
  title: string;
  mode: LearningMode;
  language: Language;
  /** Skill ids (see Skill) this challenge provides evidence for. */
  skillIds: string[];
  /** Concept tags recorded on evidence, e.g. 'print', 'f-string'. Hidden from the player in independent mode. */
  concepts: string[];
  /** 1 (trivial) .. 5 (hard for the current stage). Recorded on evidence for future adaptation. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** The story/problem. Plain text; blank lines separate paragraphs; `code` spans allowed. */
  prompt: string;
  /** Plain-language description of correct behaviour. Shown in learning/challenge mode, hidden in independent. */
  expectedBehavior?: string;
  /** Learning mode only: a short checklist walking through the task. */
  guidedSteps?: string[];
  starterCode: string;
  /** Web challenges (language 'web'): the starting HTML/CSS/JS. `starterCode` is then ''. */
  starterFiles?: WebFiles;
  /** Git challenges (language 'git'): the starting repository. The player types commands; `starterCode` is then ''. */
  git?: GitSpec;
  /** Spreadsheet challenges (language 'sheet'): the starting workbook and what the player may edit. `starterCode` is then ''. */
  sheet?: SheetSpec;
  /** Web challenges: which files the player edits, and which in-game API (dataset variant 'a') is available. */
  web?: { tabs: ('html' | 'css' | 'js')[]; api?: boolean };
  /** Files/databases available to the player's code (Run and Submit). Checks may add to these. */
  fixtures?: Fixtures;
  /** Database shown in the schema browser and used by Run for SQL challenges (default: first check's db). */
  db?: string;
  /** A multi-concept project rather than an isolated exercise. Recorded on evidence as project performance. */
  project?: boolean;
  /** Text piped to input() when the player presses Run (they can edit it in the Input box). */
  sampleInput?: string[];
  /** Ordered least -> most revealing. Never contain the full solution. Ignored in independent mode. */
  hints: string[];
  checks: Check[];
  constraints?: Constraint[];
  xpReward: number;
  coinReward: number;
  /** Optional: this challenge tests an unfamiliar context (counts as transfer evidence). */
  transfer?: boolean;
  /** Generic real-world context, e.g. 'engineering', 'finance'. For content-variety auditing. */
  context?: string;
  /**
   * Competencies needed before this challenge may be attempted outside its lesson (Practice, Daily, Training).
   * Default: every skill in `skillIds` at 'introduced'. Only set it when that default is wrong.
   */
  requires?: SkillReq[];
  /**
   * PHASE 6 BOUNDARY: what this challenge does in the game WORLD when it is passed (a robot repair, a spell, a lineup).
   * Phase 5 only records these as `worldEffect` events (see game/worldEvents.ts); nothing draws them yet.
   */
  worldEffects?: WorldEffect[];
  /** Present only on challenges authored for the Daily Challenge. */
  daily?: DailyMeta;
  /** Optional diagnostic metadata (see ChallengeDiagnostics). */
  diagnostics?: ChallengeDiagnostics;
  /** Present only on Boss challenges (content/bosses.ts): which boss version this is. */
  boss?: { bossId: string; version: string };
  /** Present only on problems authored for TRAINING (content/training/): which skills they train and their role in a plan. */
  training?: { skills: string[]; role: 'practice' | 'proof'; requires: string[] };
}

/**
 * SKILL GRAPH. How much of a skill the player has SHOWN (game/graph.ts derives it from evidence, never from XP):
 *  introduced   - passed something on it (even guided) or completed the lesson that teaches it
 *  developing   - at least one independent (hint-free) pass
 *  demonstrated - the skill's full mastery requirements are met (see Skill.masteryRequirements)
 */
export type Competency = 'none' | 'introduced' | 'developing' | 'demonstrated';

/** One prerequisite: a skill at a level (default 'introduced'), a composite competency, or a passed objective. */
export type SkillReq = { skill: string; level?: Competency } | { composite: string; level?: Competency } | { objective: string };

export interface TeachStep {
  kind: 'teach';
  title: string;
  /** Plain text paragraphs separated by blank lines. `inline code` uses backticks. */
  body: string;
}

/** A runnable example. The player must run it (actively) before continuing. */
export interface DemoStep {
  kind: 'demo';
  title: string;
  body: string;
  code: string;
  stdin?: string[];
  /** Language of the demo; defaults to the lesson's language. */
  language?: Language;
  /** Files/databases available to the demo (e.g. a CSV to read, or the database a query runs against). */
  fixtures?: Fixtures;
  /** Database a SQL demo runs against. */
  db?: string;
  /** Web demos (language 'web'): the starting HTML/CSS/JS; `code` is then ''. */
  files?: WebFiles;
  /** Web demos: serve the in-game API to the page. */
  api?: boolean;
  /** Short line shown after running, pointing out what to notice. */
  notice: string;
  /** True for demos that intentionally crash, to show a real error message. */
  expectsError?: boolean;
  /** Spreadsheet demos (language 'sheet'): the workbook shown; `code` is then ''. */
  sheet?: WorkbookData;
  /** Git demos (language 'git'): the repository the commands in `code` run against. */
  git?: RepoSnapshot;
}

export interface ChallengeStep {
  kind: 'challenge';
  challengeId: string;
}

export type LessonStep = TeachStep | DemoStep | ChallengeStep;

export interface Lesson {
  id: string;
  title: string;
  /** One-line summary for lists and the quest log. */
  blurb: string;
  language: Language;
  skillId: string;
  /** Lesson ids of the SAME learning world that must be completed first (the world's own progression graph). */
  prerequisites: string[];
  /** Competencies from ANY world that must be shown first (cross-world prerequisites); see game/graph.ts. */
  requires?: SkillReq[];
  steps: LessonStep[];
  /** XP for finishing the lesson's explanatory steps. Challenges award their own XP. */
  xpReward: number;
  /** Library card unlocked when the lesson completes (a compact reference, not a tutorial). */
  reference: { title: string; body: string; example?: string };
}

/* ------------------------------------------------------------------ skills & mastery */

export interface MasteryRequirements {
  /** Passes with no hints in challenge/independent mode. */
  independentPasses: number;
  /** ...spread over at least this many distinct challenges. */
  distinctChallenges: number;
  /** ...at least one at or above this difficulty. */
  minDifficulty: number;
  /** ...spread over at least this many different learning objectives (not just variants of one). Default 1. */
  distinctObjectives?: number;
  /** ...and at least this many different real-world contexts. Default 1. */
  distinctContexts?: number;
}

export interface Skill {
  id: string;
  title: string;
  area: string; // 'python', later 'sql', 'debugging', 'research', ...
  category: string; // grouping for the skill screen, e.g. 'Foundations'
  prerequisites: string[]; // skill ids
  masteryRequirements: MasteryRequirements;
}

/* ------------------------------------------------------------------ world & RPG content */

export type AreaId = string;

export type LockRule =
  | { type: 'none' }
  | { type: 'questAccepted'; questId: string; reason: string }
  | { type: 'questComplete'; questId: string; reason: string }
  | { type: 'lesson'; lessonId: string; reason: string }
  | { type: 'lessonsCompleted'; count: number; reason: string }
  | { type: 'skills'; requires: SkillReq[]; reason: string }
  | { type: 'future'; phase: number; reason: string };

/** An event the game WORLD can react to (Phase 6). `target` names an object in the world, `action` what happens to it. */
export interface WorldEffect {
  target: string;
  action: string;
  /** Optional data the animation/scene needs (amounts, names). */
  detail?: Record<string, string | number | boolean>;
}

export interface Area {
  id: AreaId;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  /** Position on the world map, percent of the map box. */
  pos: { x: number; y: number };
  lock: LockRule;
  /** Visual theme key used by CSS. */
  theme: string;
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  description: string;
  price: number | null; // null = not sold
  kind: 'cosmetic' | 'quest';
}

/**
 * One step of a quest. A quest is a story: lessons are still objectives, but so are the things a player does in the playable world.
 * `lesson` (the default) is done when the lesson is completed; `talk` when the NPC has been spoken to; `inspect` when that object was
 * examined; `challenge` when that challenge (or another variant of its objective) was passed; `effect` when code caused `target:action`
 * in the derived world state. Only `challenge`/`effect`/`lesson` depend on evidence; none depends on XP.
 */
export type QuestObjective =
  | { id: string; text: string; lessonId: string; kind?: 'lesson' }
  | { id: string; text: string; kind: 'talk' | 'inspect' | 'challenge' | 'effect'; ref: string; lessonId?: undefined };

export interface Quest {
  id: string;
  title: string;
  summary: string;
  giver: string;
  /** Another quest that must be complete before this one is offered (story order). */
  requires?: string;
  objectives: QuestObjective[];
  reward: { xp: number; coins: number; items?: string[] };
}

export interface AchievementDef {
  id: string;
  title: string;
  icon: string;
  description: string;
}

/** A concept the player should be able to apply. Its variants are the challenges sharing its id. */
export interface Objective {
  id: string;
  title: string;
  /** One line describing the underlying idea (used on the Practice screen). */
  summary: string;
}

/**
 * A lesson together with its challenges. One file per lesson in content/<area>/.
 * Lesson steps reference one challenge per objective; the other challenges of that objective are
 * variants offered when the player retries or practises.
 */
export interface LessonBundle {
  lesson: Lesson;
  challenges: Challenge[];
  /** Titles for objectives that have variants (objectives without an entry are titled after their challenge). */
  objectives?: Objective[];
}
