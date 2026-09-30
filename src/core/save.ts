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
export const SAVE_VERSION = 4;

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

/** The challenge currently on offer. Persisted, so reload / closing the browser cannot re-roll it. */
export interface DailyCurrent {
  challengeId: string;
  /** 'current' reinforces what the player is learning now; 'review' revisits an older skill. */
  focus: 'current' | 'review';
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
  focus: 'current' | 'review';
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
    (cur.status === 'open' || cur.status === 'passed' || cur.status === 'failed') && (cur.focus === 'current' || cur.focus === 'review') &&
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
};

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
