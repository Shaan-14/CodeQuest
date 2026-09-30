import { useEffect, useState } from 'preact/hooks';
import { refreshDaily } from '../../game/daily';
import { getStore } from '../../game/store';

const TICK_MS = 30_000;

/**
 * Keeps the Daily Challenge clock moving: refreshes on load, every 30 seconds, and when the tab becomes visible.
 * The clock guard (lastSeenAt) is persisted on every tick, but the UI only re-renders when the offer changed.
 */
export function useDailyClock(): void {
  useEffect(() => {
    const tick = () => {
      const store = getStore();
      const before = store.save.daily.current;
      const r = refreshDaily(store.save, Date.now());
      const changed = r.save.daily.current?.issuedAt !== before?.issuedAt || r.save.daily.history.length !== store.save.daily.history.length;
      store.apply(r, { silent: !changed });
    };
    tick();
    const id = setInterval(tick, TICK_MS);
    const vis = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', vis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);
}

/** Current time, re-read every `everyMs` (for countdowns). */
export function useNow(everyMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}
