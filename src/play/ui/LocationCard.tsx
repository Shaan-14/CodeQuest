import { useEffect, useRef, useState } from 'preact/hooks';

/** The name of a place, shown big for a moment when the player arrives: the way a game says "you are here". Announced to screen readers. */
export function LocationCard({ title, blurb, sceneKey, quiet = false }: { title: string; blurb: string; sceneKey: string; /** A cutaway is playing: arriving somewhere for a scene is not arriving. */ quiet?: boolean }) {
  const [shown, setShown] = useState(true);
  const lastKey = useRef('');
  // coming back from a cutaway to the place the player was already in is not arriving, so nothing is announced
  useEffect(() => { if (quiet) { setShown(false); return; } if (lastKey.current === sceneKey) return; lastKey.current = sceneKey; setShown(true); const t = window.setTimeout(() => setShown(false), 3600); return () => clearTimeout(t); }, [sceneKey, quiet]);
  return (
    <div class="loc-wrap" role="status" aria-live="polite">
      {shown && <div class="loc-card" key={sceneKey} data-testid="location-card"><div class="loc-rule" /><div class="loc-title">{title}</div><div class="loc-blurb">{blurb}</div><div class="loc-rule" /></div>}
    </div>
  );
}
