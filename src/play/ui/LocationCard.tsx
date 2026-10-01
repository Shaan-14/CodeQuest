import { useEffect, useState } from 'preact/hooks';

/** The name of a place, shown big for a moment when the player arrives: the way a game says "you are here". Announced to screen readers. */
export function LocationCard({ title, blurb, sceneKey }: { title: string; blurb: string; sceneKey: string }) {
  const [shown, setShown] = useState(true);
  useEffect(() => { setShown(true); const t = window.setTimeout(() => setShown(false), 3600); return () => clearTimeout(t); }, [sceneKey]);
  return (
    <div class="loc-wrap" role="status" aria-live="polite">
      {shown && <div class="loc-card" key={sceneKey} data-testid="location-card"><div class="loc-rule" /><div class="loc-title">{title}</div><div class="loc-blurb">{blurb}</div><div class="loc-rule" /></div>}
    </div>
  );
}
