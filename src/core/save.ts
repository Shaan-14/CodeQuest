/**
 * Versioned save data in localStorage.
 * Every change to SaveData's shape must bump SAVE_VERSION and add a migration step.
 * Storage is injected so this module is testable without a browser.
 */
export const SAVE_KEY = 'codequest.save';
export const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  /** Placeholder counter used by the shell to verify persistence. Remove when real state exists. */
  launches: number;
}

export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

export function newSave(): SaveData {
  return { version: SAVE_VERSION, launches: 0 };
}

/** Migrate older saves forward. Returns null if the data is unusable. */
export function migrate(raw: unknown): SaveData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as Partial<SaveData>;
  if (data.version === SAVE_VERSION && typeof data.launches === 'number') return data as SaveData;
  // Future: if (data.version === 1) { ...upgrade to 2... }
  return null;
}

export function loadSave(store: KeyValueStore): SaveData {
  try {
    const text = store.getItem(SAVE_KEY);
    if (text) return migrate(JSON.parse(text)) ?? newSave();
  } catch {
    // Corrupt or inaccessible storage: fall back to a fresh save.
  }
  return newSave();
}

export function writeSave(store: KeyValueStore, data: SaveData): void {
  store.setItem(SAVE_KEY, JSON.stringify(data));
}
