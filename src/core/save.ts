/**
 * Versioned save data in localStorage.
 *
 * RULES (see CLAUDE.md): any change to SaveData's shape must bump SAVE_VERSION and add a step to
 * MIGRATIONS so existing players keep their progress. Storage is injected so this module is
 * testable without a browser. A save that cannot be read is copied to BACKUP_KEY before being
 * replaced, so it is never silently destroyed.
 */
import type { EvidenceRecord } from '../learning/mastery';

export const SAVE_KEY = 'codequest.save';
export const BACKUP_KEY = 'codequest.save.backup';
export const SAVE_VERSION = 8;

export interface PlayerProfile {
  name: string;
  /** Avatar preset id (see content/avatars). */
  avatar: string;
  createdAt: string;
}

export interface QuestState {
  status: 'active' | 'complete';
  acceptedAt: string;
  completedAt?: string;
}

export interface LessonProgress {
  /** Index of the furthest step reached. */
  stepIndex: number;
  completed: boolean;
  completedAt?: string;
}

export interface ChallengeProgress {
  /** Graded submissions. */
  attempts: number;
  /** Times the Run button was used. */
  runs: number;
  /** Hints revealed so far (highest hint index + 1). Never decreases. */
  hintsUsed: number;
  passed: boolean;
  passedAt?: string;
  /** Reference-manual entries opened while working on this challenge (research behaviour). */
  lookups?: number;
  /** Hints used on the best (least-assisted) passing attempt. */
  bestHintsUsed?: number;
  /** XP/coins already paid out for this challenge (so a later, more independent solve pays the difference only). */
  xpAwarded: number;
  coinsAwarded: number;
  /** Active time spent on this challenge in ms. */
  timeMs: number;
  /** Player's last code draft. */
  code?: string;
}

/** What a Daily Challenge pays when (and only when) it is solved. Rewards never touch mastery. */
export interface DailyReward {
  coins: number;
  xp: number;
  focus: number;
}

/**
 * Why a Daily was chosen. 'current' reinforces what the player is learning now; 'review' revisits an older skill;
 * 'mixed' (Phase 5) combines skills across worlds or transfers them to an unfamiliar setting.
 */
export type DailyFocus = 'current' | 'review' | 'mixed';
export const isDailyFocus = (v: unknown): v is DailyFocus => v === 'current' || v === 'review' || v === 'mixed';

/** The challenge currently on offer. Persisted, so reload / closing the browser cannot re-roll it. */
export interface DailyCurrent {
  challengeId: string;
  focus: DailyFocus;
  skillId: string;
  category: string;
  difficulty: number;
  issuedAt: string;
  /** issuedAt + 12h. After this the challenge disappears and a new one is issued. */
  expiresAt: string;
  status: 'open' | 'passed' | 'failed';
  /** Graded submissions: 0 or 1. ONE attempt only, no retries. */
  attempts: number;
  resolvedAt?: string;
  /** Plain-language reason the selection system chose this (shown to the player). */
  reason: string;
  reward: DailyReward;
}

/** One finished (or missed) daily. Kept for retention memory and achievements; never deleted by a reset of the timer. */
export interface DailyRecord {
  challengeId: string;
  focus: DailyFocus;
  skillIds: string[];
  category: string;
  difficulty: number;
  issuedAt: string;
  resolvedAt?: string;
  /** 'missed' = the period ended with no submission. Missing a daily has no penalty. */
  outcome: 'passed' | 'failed' | 'missed';
  coins: number;
  xp: number;
}

export interface DailyState {
  current: DailyCurrent | null;
  history: DailyRecord[];
  /** Latest clock reading the game has seen. The effective time never goes backwards (clock-rollback guard). */
  lastSeenAt: string | null;
}

export const emptyDaily = (): DailyState => ({ current: null, history: [], lastSeenAt: null });
export const DAILY_HISTORY_LIMIT = 500;

/** Repairs a daily block from an untrusted save: anything malformed is dropped rather than failing the whole save. */
export function sanitizeDaily(raw: unknown): DailyState {
  if (typeof raw !== 'object' || raw === null) return emptyDaily();
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  const iso = (v: unknown) => typeof v === 'string' && !Number.isNaN(Date.parse(v));
  const cur = r.current as Record<string, unknown> | null;
  const okCur =
    !!cur && typeof cur === 'object' && typeof cur.challengeId === 'string' && iso(cur.issuedAt) && iso(cur.expiresAt) &&
    (cur.status === 'open' || cur.status === 'passed' || cur.status === 'failed') && isDailyFocus(cur.focus) &&
    num(cur.difficulty) && num(cur.attempts) && typeof cur.skillId === 'string' && typeof cur.reward === 'object' && cur.reward !== null;
  const history = (Array.isArray(r.history) ? r.history : []).filter(
    (h): h is DailyRecord => !!h && typeof h === 'object' && typeof h.challengeId === 'string' && iso(h.issuedAt) && ['passed', 'failed', 'missed'].includes(h.outcome) && Array.isArray(h.skillIds) && num(h.difficulty),
  );
  return {
    current: okCur ? (cur as unknown as DailyCurrent) : null,
    history: history.slice(-DAILY_HISTORY_LIMIT),
    lastSeenAt: iso(r.lastSeenAt) ? (r.lastSeenAt as string) : null,
  };
}


/* ------------------------------------------------------------------ Phase 4: adaptive training */

export type WeaknessKind = 'concept' | 'application' | 'combination' | 'hint-reliance' | 'rust' | 'prerequisite' | 'boss-prep' | 'review';
export type Severity = 'minor' | 'moderate' | 'serious' | 'major';
export type PlanLevel = 'refresher' | 'targeted' | 'extended' | 'deep';
export type WeaknessSource = 'lesson' | 'practice' | 'daily' | 'boss' | 'training' | 'quiet' | 'upcoming';

/** Where the player stands in the CURRICULUM when training starts. Training never changes this; it only remembers it. */
export interface ReturnPoint {
  kind: 'lesson' | 'area' | 'boss' | 'daily' | 'map';
  lessonId?: string;
  /** Step of the lesson the player was on (informational: lesson progress itself is never touched by training). */
  stepIndex?: number;
  challengeId?: string;
  areaId?: string;
  bossId?: string;
}

/** Something the evidence says the player should work on. Kept forever: resolved weaknesses are history, not garbage. */
export interface Weakness {
  id: string;
  /** Skill id, or a composite key such as `py.loops+py.dicts` for a combination. Merges repeated detections. */
  key: string;
  skillIds: string[];
  compositeId?: string;
  kind: WeaknessKind;
  severity: Severity;
  status: 'open' | 'training' | 'resolved';
  source: WeaknessSource;
  /** The submission that exposed it. */
  exposedBy: { challengeId: string; objectiveId: string; context: string; lessonId?: string; at: string };
  detectedAt: string;
  /** Failed attempts (on the exposing objective) that fed this detection. */
  failures: number;
  hintsUsed: number;
  hintLevels: number[];
  /** Mistake categories (authored mistake ids, or error kinds) seen so far. */
  mistakes: string[];
  /** Plain-language reasons the diagnosis gave (what the player is shown). */
  reasons: string[];
  /** Independent passes on these skills BEFORE this weakness was detected (previous mastery is preserved, never erased). */
  previousIndependent: number;
  /** Contexts (real-world settings) in which it caused trouble. */
  struggledIn: string[];
  planIds: string[];
  /**
   * True when the failure happened in the curriculum (a lesson or a boss) and was meaningful: the curriculum is blocked
   * until this weakness's training is complete. Absent/false for optional needs (practice, dailies, quiet skills).
   */
  required?: boolean;
  /** Failure level (1-5) of the newest required failure: how much Focus it cost and how deep the training is. */
  focusLevel?: number;
  resolvedAt?: string;
  resolvedBy?: string;
}

/** review = "see it differently", example = a different worked example, predict = a prediction question, practice = a fresh problem with help, independent = THE one final fresh problem. guided/combined are legacy (older saves). */
export type TrainingStepKind = 'review' | 'example' | 'predict' | 'guided' | 'practice' | 'combined' | 'independent';

export interface TrainingStep {
  id: string;
  kind: TrainingStepKind;
  skillId: string;
  /** Fresh problem for practice-type steps. Absent on review/example steps. */
  challengeId?: string;
  done: boolean;
  passed?: boolean;
  attempts: number;
  /** Focus this step earns when completed (set on required plans; see game/focus.ts). Absent = earns nothing. */
  focus?: number;
}

export interface TrainingPlan {
  id: string;
  weaknessId: string;
  level: PlanLevel;
  /** True when the plan restores Focus the player lost: the exposing challenge stays "not ready" until it is complete. */
  required: boolean;
  /** Failure level (1-5, see game/focus.ts) that created the plan, and the Focus it cost. */
  focusLevel?: number;
  focusLost?: number;
  createdAt: string;
  returnTo: ReturnPoint;
  steps: TrainingStep[];
  status: 'active' | 'complete' | 'abandoned';
  completedAt?: string;
  /** How many times a failed independent step made the plan grow. */
  escalations: number;
  /** Independent passes on the plan's skills BEFORE training and hint-free passes after it (for the history view). */
  before: { independentPasses: number; failures: number };
  after?: { independentPasses: number };
}

export interface TrainingState {
  weaknesses: Weakness[];
  /** Every plan ever made (active, complete, abandoned): the training history. */
  plans: TrainingPlan[];
  activePlanId: string | null;
  nextId: number;
}

export const emptyTraining = (): TrainingState => ({ weaknesses: [], plans: [], activePlanId: null, nextId: 1 });
export const TRAINING_LIMIT = 400;

/** Repairs an untrusted training block: malformed entries are dropped, never fatal. */
export function sanitizeTraining(raw: unknown): TrainingState {
  if (typeof raw !== 'object' || raw === null) return emptyTraining();
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => typeof v === 'string';
  const weaknesses = (Array.isArray(r.weaknesses) ? r.weaknesses : []).filter(
    (w): w is Weakness => !!w && typeof w === 'object' && str(w.id) && str(w.key) && Array.isArray(w.skillIds) && ['open', 'training', 'resolved'].includes(w.status) && typeof w.exposedBy === 'object' && w.exposedBy !== null,
  ).map((w) => ({ ...w, hintLevels: Array.isArray(w.hintLevels) ? w.hintLevels : [], mistakes: Array.isArray(w.mistakes) ? w.mistakes : [], reasons: Array.isArray(w.reasons) ? w.reasons : [], struggledIn: Array.isArray(w.struggledIn) ? w.struggledIn : [], planIds: Array.isArray(w.planIds) ? w.planIds : [] }));
  const plans = (Array.isArray(r.plans) ? r.plans : []).filter(
    (p): p is TrainingPlan => !!p && typeof p === 'object' && str(p.id) && str(p.weaknessId) && Array.isArray(p.steps) && ['active', 'complete', 'abandoned'].includes(p.status) && typeof p.returnTo === 'object' && p.returnTo !== null,
  );
  const active = plans.find((p) => p.id === r.activePlanId && p.status === 'active');
  return {
    weaknesses: weaknesses.slice(-TRAINING_LIMIT),
    plans: plans.slice(-TRAINING_LIMIT),
    activePlanId: active ? active.id : null,
    nextId: typeof r.nextId === 'number' && Number.isFinite(r.nextId) && r.nextId >= 1 ? Math.floor(r.nextId) : weaknesses.length + plans.length + 1,
  };
}

/* ------------------------------------------------------------------ Phase 4: bosses and the campaign */

export interface BossAttempt {
  version: string;
  challengeId: string;
  at: string;
  passed: boolean;
  /** Weakness ids diagnosed from a failed attempt. */
  weaknessIds: string[];
}

export interface BossState {
  attempts: BossAttempt[];
  passedAt?: string;
  /** After a failure the boss stays sealed until this training plan is complete (remediation before a new version). */
  remediationPlanId?: string;
  /** The weakness diagnosed from the last failed attempt: the boss stays sealed until its training is complete (or it is resolved). */
  remediationWeaknessId?: string;
}

export interface CampaignState {
  /** Set once, when the final capstone is passed. The player has completed CodeQuest. */
  completedAt?: string;
}

export const emptyBosses = (): Record<string, BossState> => ({});

export function sanitizeBosses(raw: unknown): Record<string, BossState> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const out: Record<string, BossState> = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    const b = v as Partial<BossState> | null;
    if (!b || typeof b !== 'object' || !Array.isArray(b.attempts)) continue;
    const attempts = b.attempts.filter((a): a is BossAttempt => !!a && typeof a === 'object' && typeof a.version === 'string' && typeof a.challengeId === 'string' && typeof a.passed === 'boolean' && typeof a.at === 'string').map((a) => ({ ...a, weaknessIds: Array.isArray(a.weaknessIds) ? a.weaknessIds : [] }));
    out[id] = { attempts, passedAt: typeof b.passedAt === 'string' ? b.passedAt : undefined, remediationPlanId: typeof b.remediationPlanId === 'string' ? b.remediationPlanId : undefined, remediationWeaknessId: typeof b.remediationWeaknessId === 'string' ? b.remediationWeaknessId : undefined };
  }
  return out;
}

/* ------------------------------------------------------------------ Phase 5: where the player has been */

/** Which learning worlds the player has entered and where they were last: so the map can say "you are here" and "continue". */
export interface ExploreState {
  /** Track ids (content/worlds.ts) in the order first visited. */
  visited: string[];
  /** The world last entered, or null. */
  last: string | null;
}
export const emptyExplore = (): ExploreState => ({ visited: [], last: null });
export function sanitizeExplore(raw: unknown): ExploreState {
  if (typeof raw !== 'object' || raw === null) return emptyExplore();
  const r = raw as Record<string, unknown>;
  const visited = Array.isArray(r.visited) ? [...new Set(r.visited.filter((v): v is string => typeof v === 'string'))].slice(0, 32) : [];
  return { visited, last: typeof r.last === 'string' ? r.last : null };
}

export interface SaveData {
  version: number;
  player: PlayerProfile | null;
  stats: { xp: number; coins: number; focus: number };
  inventory: Record<string, number>;
  quests: Record<string, QuestState>;
  achievements: Record<string, string>;
  unlockedAreas: string[];
  learning: {
    lessons: Record<string, LessonProgress>;
    challenges: Record<string, ChallengeProgress>;
  };
  /** One-off story/tutorial flags, e.g. 'mentor-intro'. */
  flags: Record<string, boolean>;
  evidence: EvidenceRecord[];
  /** Phase 3: the 12-hour Daily Challenge (current offer, history, clock guard). */
  daily: DailyState;
  /** Phase 4: detected weaknesses and training plans (adaptive training). Curriculum progress never lives here. */
  training: TrainingState;
  /** Phase 4: boss attempts by boss id. */
  bosses: Record<string, BossState>;
  /** Phase 4: the campaign ending. */
  campaign: CampaignState;
  /** Phase 5: which worlds the player has visited (navigation only, never progress). */
  explore: ExploreState;
}

export const MAX_FOCUS = 100;

export function newSave(): SaveData {
  return {
    version: SAVE_VERSION,
    player: null,
    stats: { xp: 0, coins: 0, focus: MAX_FOCUS },
    inventory: {},
    quests: {},
    achievements: {},
    unlockedAreas: [],
    learning: { lessons: {}, challenges: {} },
    flags: {},
    evidence: [],
    daily: emptyDaily(),
    training: emptyTraining(),
    bosses: emptyBosses(),
    campaign: {},
    explore: emptyExplore(),
  };
}

export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

/** Each entry upgrades a save FROM the keyed version to the next one. */
const MIGRATIONS: Record<number, (old: Record<string, unknown>) => Record<string, unknown>> = {
  // v1 was the Phase 0 shell (`{ version, launches }`): it held no player data, so start fresh.
  1: () => ({ ...newSave() }),
  // v2 -> v3 (Phase 2): evidence records gained objectiveId/context/lookups/priorFailures/project.
  // `context` cannot be known here (content lives in the game layer); backfillEvidence() fills it at load.
  2: (old) => {
    const seen = new Map<string, number>(); // objective -> failed attempts so far
    const evidence = ((old.evidence as Record<string, unknown>[] | undefined) ?? []).map((r) => {
      const objectiveId = (r.objectiveId as string | undefined) ?? (r.challengeId as string);
      const priorFailures = seen.get(objectiveId) ?? 0;
      if (!r.passed) seen.set(objectiveId, priorFailures + 1);
      return { objectiveId, context: '', lookups: 0, priorFailures, project: false, ...r };
    });
    return { ...old, evidence };
  },
  // v3 -> v4 (Phase 3): the Daily Challenge block. Old saves simply start with no daily on offer.
  3: (old) => ({ ...old, daily: emptyDaily() }),
  // v4 -> v5 (Phase 4): training state, boss attempts and the campaign flag. Nothing existing is touched: old evidence
  // keeps working (the new evidence fields are optional) and old players start with no weaknesses and no plans.
  4: (old) => ({ ...old, training: emptyTraining(), bosses: emptyBosses(), campaign: {} }),
  // v5 -> v6 (Phase 4 revision): weaknesses may be `required` (they block the curriculum until trained). Weaknesses recorded
  // by v5 stay optional, so nobody is blocked by an old save.
  5: (old) => ({ ...old }),
  // v6 -> v7 (Focus gate): Focus is now only earned back by training, and the Rest button and Focus consumables are gone.
  // Nobody is punished retroactively: an old save starts at full Focus, and consumables they bought are refunded in coins.
  6: (old) => {
    const inventory = { ...((old.inventory as Record<string, number> | undefined) ?? {}) };
    const stats: Record<string, number> = { ...((old.stats as Record<string, number> | undefined) ?? {}), focus: MAX_FOCUS };
    for (const [id, price] of Object.entries(REMOVED_CONSUMABLES)) {
      if (inventory[id]) { stats.coins = (stats.coins ?? 0) + inventory[id]! * price; delete inventory[id]; }
    }
    return { ...old, inventory, stats };
  },
  // v7 -> v8 (Phase 5): the nonlinear skill graph. Progress is unchanged (evidence, lessons and quests carry over as they were);
  // saves gain an `explore` block (which worlds were visited) and Daily records may carry the new 'mixed' kind.
  // Nothing is lost or re-locked: access is now computed from demonstrated skills, and a player who had finished a lesson keeps it.
  7: (old) => ({ ...old, explore: emptyExplore() }),
};
/** Shop items that restored Focus directly. They no longer exist: Focus is earned through training. */
const REMOVED_CONSUMABLES: Record<string, number> = { 'study-snack': 10, 'focus-tea': 25 };

/**
 * Focus below the maximum only makes sense while a required training plan is active (that plan is how it comes back).
 * A save that says otherwise (hand-edited, or an interrupted older build) is repaired to full Focus rather than left stuck.
 */
function sanitizeFocus(d: SaveData): void {
  const f = d.stats.focus;
  d.stats.focus = typeof f === 'number' && Number.isFinite(f) ? Math.max(0, Math.min(MAX_FOCUS, Math.round(f))) : MAX_FOCUS;
  const owed = d.training.plans.some((p) => p.status === 'active' && p.required);
  if (d.stats.focus < MAX_FOCUS && !owed) d.stats.focus = MAX_FOCUS;
}

export function migrate(raw: unknown): SaveData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  let data = raw as Record<string, unknown>;
  const start = data.version;
  if (typeof start !== 'number' || start < 1 || start > SAVE_VERSION) return null;
  for (let version = start; version < SAVE_VERSION; version++) {
    const step = MIGRATIONS[version];
    if (!step) return null;
    data = step(data);
    data.version = version + 1;
  }
  if (!isSaveData(data)) return null;
  data.daily = sanitizeDaily(data.daily);
  data.training = sanitizeTraining(data.training);
  data.bosses = sanitizeBosses(data.bosses);
  sanitizeFocus(data);
  data.explore = sanitizeExplore(data.explore);
  data.campaign = typeof data.campaign === 'object' && data.campaign !== null ? { completedAt: typeof (data.campaign as CampaignState).completedAt === 'string' ? (data.campaign as CampaignState).completedAt : undefined } : {};
  return data;
}

function isSaveData(d: Record<string, unknown>): d is SaveData & Record<string, unknown> {
  return (
    typeof d.stats === 'object' && d.stats !== null &&
    typeof d.learning === 'object' && d.learning !== null &&
    Array.isArray(d.evidence) && Array.isArray(d.unlockedAreas) &&
    typeof d.inventory === 'object' && typeof d.quests === 'object' &&
    typeof d.achievements === 'object' && typeof d.flags === 'object'
  );
}

export type LoadStatus = 'loaded' | 'new' | 'recovered';

export function loadSave(store: KeyValueStore): { save: SaveData; status: LoadStatus } {
  let text: string | null = null;
  try {
    text = store.getItem(SAVE_KEY);
  } catch {
    return { save: newSave(), status: 'new' };
  }
  if (!text) return { save: newSave(), status: 'new' };
  try {
    const save = migrate(JSON.parse(text));
    if (save) return { save, status: 'loaded' };
  } catch {
    /* fall through to backup */
  }
  try {
    store.setItem(BACKUP_KEY, text);
  } catch {
    /* nothing more we can do */
  }
  return { save: newSave(), status: 'recovered' };
}

export function writeSave(store: KeyValueStore, data: SaveData): void {
  store.setItem(SAVE_KEY, JSON.stringify(data));
}

/** Export/import as text so players can back up progress by hand. */
export function exportSave(data: SaveData): string {
  return JSON.stringify(data);
}
export function importSave(text: string): SaveData | null {
  try {
    return migrate(JSON.parse(text));
  } catch {
    return null;
  }
}
