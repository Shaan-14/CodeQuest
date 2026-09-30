/**
 * Reactive game store: holds the current SaveData, persists it after every action, and
 * exposes transient UI events (toasts). The only module that touches localStorage at runtime.
 */
import { useEffect, useState } from 'preact/hooks';
import { loadSave, writeSave, type KeyValueStore, type LoadStatus, type SaveData } from '../core/save';
import type { GameEvent } from './events';
import type { Result } from './actions';
import { backfillEvidence } from './backfill';

export interface Toast {
  id: number;
  event: GameEvent;
}

export class GameStore {
  save: SaveData;
  loadStatus: LoadStatus;
  toasts: Toast[] = [];
  private nextToast = 1;
  private listeners = new Set<() => void>();
  private eventListeners = new Set<(e: GameEvent) => void>();

  constructor(private storage: KeyValueStore) {
    const loaded = loadSave(storage);
    this.save = backfillEvidence(loaded.save);
    this.loadStatus = loaded.status;
  }

  // Methods the UI destructures (`const { save, apply } = useGame()`) are arrow properties so `this` can never be lost (a real bug: a detached
  // `apply` threw silently and made every Accept-quest button do nothing).
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private emit = () => {
    this.listeners.forEach((l) => l());
  };

  /** Apply a pure action result: persist, queue toasts, notify the UI. */
  apply = (result: Result, opts: { silent?: boolean } = {}): void => {
    this.save = result.save;
    try {
      writeSave(this.storage, this.save);
    } catch {
      /* storage full or blocked: keep playing in memory */
    }
    for (const event of result.events) this.toasts = [...this.toasts, { id: this.nextToast++, event }];
    if (!opts.silent) this.emit();
    for (const event of result.events) this.eventListeners.forEach((l) => l(event));
  };

  dismissToast = (id: number): void => {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.emit();
  };

  /** The stream of game events (what just happened) for things that react to play, like the 3D world. Returns an unsubscribe. */
  onEvent = (fn: (e: GameEvent) => void): (() => void) => {
    this.eventListeners.add(fn);
    return () => this.eventListeners.delete(fn);
  };
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
