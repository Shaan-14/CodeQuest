import type { Area } from '../../content/schema';
import { areaIsFuture, lockReason } from '../../game/world';

export function Locked({ area, onMap }: { area: Area; onMap: () => void }) {
  const future = areaIsFuture(area);
  return (
    <main class={`scene theme-${area.theme}`} data-testid="locked-screen">
      <div class="scene-card center">
        <div class="big-icon">🔒</div>
        <h1>{area.name}</h1>
        <p class="tagline">{area.tagline}</p>
        <p>{area.description}</p>
        <p class="callout" data-testid="lock-reason">{lockReason(area)}</p>
        {future && <p class="muted small">This place is planned. It will be part of CodeQuest in a later phase.</p>}
        <button class="btn" onClick={onMap}>Back to the map</button>
      </div>
    </main>
  );
}
