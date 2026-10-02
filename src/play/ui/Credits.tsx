import { useEffect, useRef } from 'preact/hooks';
import { cast } from '../../content/play/cast';
import { worlds3d } from '../../content/play/worlds3d';
import { WORLD_DEEDS } from '../../content/play/deeds';
import { useGame } from '../../game/store';
import { hasEffect } from '../logic/conditions';

/**
 * The credits, over the restored plaza (the 3D world keeps moving behind them). They credit what the player DID, from the world's own record
 * (the same deeds the ending card lists), then the people of Bytehaven. They scroll by themselves, can be skipped, and under reduced motion
 * they are a plain list that waits for a click.
 */
export function Credits({ onDone, reduced }: { onDone: () => void; reduced: boolean }) {
  const { save } = useGame();
  const deeds = WORLD_DEEDS.filter((d) => hasEffect(save, d.effect));
  const people = cast.filter((n) => !['juno', 'juno-hub'].includes(n.id) || n.id === 'juno-hub');
  const done = useRef(onDone); done.current = onDone;
  useEffect(() => { if (reduced) return; const t = window.setTimeout(() => done.current(), 29000); return () => clearTimeout(t); }, [reduced]);
  return (
    <div class={`credits ${reduced ? 'static' : ''}`} role="region" aria-label="Credits" data-testid="credits">
      <div class="credits-roll">
        <h1>CODEQUEST</h1>
        <p class="credits-sub">The Restoration of Bytehaven</p>
        <h2>What you brought back</h2>
        <ul>{worlds3d.filter((w) => ['robotics', 'academy', 'ballpark', 'racing'].includes(w.id)).map((w) => <li key={w.id}><b>{w.icon} {w.name}</b><span>{w.teaches}</span></li>)}</ul>
        {deeds.length > 0 && <><h2>In your own words, in your own code</h2><ul>{deeds.map((d) => <li key={d.effect}><span>{d.text}</span></li>)}</ul></>}
        <h2>The people of Bytehaven</h2>
        <ul>{people.map((n) => <li key={n.id}><b>{n.name}</b><span>{n.role}</span></li>)}</ul>
        <p class="credits-sub">Nothing in this city was handed to you. Every light you see, you lit.</p>
        <h2>Thank you for playing</h2>
      </div>
      {reduced && <button class="btn gold credits-go" onClick={onDone} autoFocus data-testid="credits-continue">Continue</button>}
    </div>
  );
}
