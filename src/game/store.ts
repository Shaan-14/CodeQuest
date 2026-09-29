/**
 * Reactive game store: holds the current SaveData, persists it after every action, and
 * exposes transient UI events (toasts). The only module that touches localStorage at runtime.
 */
import { useEffect, useState } from 'preact/hooks';
import { loadSave, writeSave, type KeyValueStore, type LoadStatus, type SaveData } from '../core/save';
import type { GameEvent } from './events';
import type { Result } from './actions';

export interface Toast {
  id: number;
  event: GameEvent;
}

class GameStore {
  save: SaveData;
  loadStatus: LoadStatus;
  toasts: Toast[] = [];
  private nextToast = 1;
  private listeners = new Set<() => void>();

  constructor(private storage: KeyValueStore) {
    const loaded = loadSave(storage);
    this.save = loaded.save;
    this.loadStatus = loaded.status;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  /** Apply a pure action result: persist, queue toasts, notify the UI. */
  apply(result: Result): void {
    this.save = result.save;
    try {
      writeSave(this.storage, this.save);
    } catch {
      /* storage full or blocked: keep playing in memory */
    }
    for (const event of result.events) this.toasts = [...this.toasts, { id: this.nextToast++, event }];
    this.emit();
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.emit();
  }
}

let store: GameStore | null = null;
export function getStore(): GameStore {
  return (store ??= new GameStore(window.localStorage));
}

/** Re-render the calling component whenever the store changes. */
export function useGame(): GameStore {
  const s = getStore();
  const [, force] = useState(0);
  useEffect(() => s.subscribe(() => force((n) => n + 1)), [s]);
  return s;
}
