/**
 * Curriculum content schema. Content is DATA (typed objects in src/content/<area>/), never
 * hardcoded in UI components. The learning engine, UI and mastery system only depend on
 * these types, so new languages/lessons are added by adding data (and, for a new language,
 * a CodeRunner implementation — see src/learning/runner.ts).
 *
 * Phase 1 changes vs Phase 0: `Challenge.tests: {name, code}[]` was replaced by declarative
 * `checks` + `constraints` (behavioural, language-agnostic descriptions that a runner
 * evaluates), and `Lesson`, `Quest`, `Item`, `Area` etc. were added.
 */
import type { Language } from '../learning/runner';

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

interface CheckBase {
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

export type Check = OutputCheck | VariableCheck | CallCheck;

/** Structural rule on the player's source, so a loop lesson cannot be passed by copy-pasting print(). */
export interface Constraint {
  type: 'requires' | 'forbids';
  /** A Python AST node class name ('For', 'While', 'If', 'FunctionDef') or 'call:<name>' for a call to a builtin/function. */
  node: string;
  message: string;
}

/* ------------------------------------------------------------------ challenges & lessons */

export interface Challenge {
  id: string;
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
}

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
  /** Short line shown after running, pointing out what to notice. */
  notice: string;
  /** True for demos that intentionally crash, to show a real error message. */
  expectsError?: boolean;
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
  /** Lesson ids that must be completed first. */
  prerequisites: string[];
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
  | { type: 'future'; phase: number; reason: string };

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
  kind: 'consumable' | 'cosmetic' | 'quest';
  /** Focus restored when used (consumables). */
  restoreFocus?: number;
}

export interface QuestObjective {
  id: string;
  text: string;
  /** Completed when this lesson is completed. */
  lessonId: string;
}

export interface Quest {
  id: string;
  title: string;
  summary: string;
  giver: string;
  objectives: QuestObjective[];
  reward: { xp: number; coins: number; items?: string[] };
}

export interface AchievementDef {
  id: string;
  title: string;
  icon: string;
  description: string;
}

/** A lesson together with the challenges its steps reference. One file per lesson in content/<area>/. */
export interface LessonBundle {
  lesson: Lesson;
  challenges: Challenge[];
}
