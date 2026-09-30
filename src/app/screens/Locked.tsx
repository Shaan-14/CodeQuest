import type { Area } from '../../content/schema';
import { areaGaps } from '../../game/graph';
import { areaIsFuture, lockReason } from '../../game/world';
import { useGame } from '../../game/store';
import { PrerequisitePanel } from '../components/PrerequisitePanel';

/** An area the player cannot enter yet: a skill gate explains exactly what is missing; other reasons keep their plain text. */
export function Locked({ area, onMap, onOpenLesson }: { area: Area; onMap: () => void; onOpenLesson?: (lessonId: string) => void }) {
  const { save } = useGame();
  const future = areaIsFuture(area);
  const gated = area.lock.type === 'skills' && areaGaps(save, area).length > 0;
  return (
    <main class={`scene theme-${area.theme}`} data-testid="locked-screen">
      <div class="scene-card center">
        <div class="big-icon">{gated ? '🧩' : '🔒'}</div>
        <h1>{area.name}</h1>
        <p class="tagline">{area.tagline}</p>
        <p>{area.description}</p>
        {gated && area.lock.type === 'skills' ? (
          <PrerequisitePanel title={area.name} reqs={area.lock.requires} reason={area.lock.reason} onOpenLesson={onOpenLesson ?? (() => undefined)} onBack={onMap} backLabel="Back to the map" />
        ) : (
          <>
            <p class="callout" data-testid="lock-reason">{lockReason(area)}</p>
            {future && <p class="muted small">This place is planned. It will be part of CodeQuest in a later phase.</p>}
            <button class="btn" onClick={onMap}>Back to the map</button>
          </>
        )}
      </div>
    </main>
  );
}
