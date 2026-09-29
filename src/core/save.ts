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
export const SAVE_VERSION = 3;

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
  return isSaveData(data) ? data : null;
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
