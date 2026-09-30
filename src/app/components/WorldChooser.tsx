import { areas } from '../../content/world';
import { worlds } from '../../content/worlds';
import { areaGaps, describeGap, worldLessons } from '../../game/graph';
import { useGame } from '../../game/store';
import { isAreaUnlocked } from '../../game/world';

/**
 * "Where do you want to go?": every learning world with its honest state. Foundations are open to everyone; a world that
 * combines others says exactly what it needs. Nothing here is an order: begin anywhere and come back later.
 */
export function WorldChooser({ onEnter }: { onEnter: (areaId: string) => void }) {
  const { save } = useGame();
  return (
    <section class="panel" data-testid="world-chooser">
      <h2>🧭 Choose your path</h2>
      <p class="muted small">Every world below teaches a different technology. Start anywhere, leave whenever you like, and come back: your progress in each one stays exactly as you left it.</p>
      <div class="world-grid">
        {worlds.map((w) => {
          const area = areas.find((a) => a.id === w.areaId)!;
          const open = isAreaUnlocked(area, save);
          const list = worldLessons(save, w.track);
          const done = list.filter((x) => save.learning.lessons[x.lesson.id]?.completed).length;
          const started = list.some((x) => (save.learning.lessons[x.lesson.id]?.stepIndex ?? 0) > 0);
          const gaps = open ? [] : areaGaps(save, area);
          return (
            <div class={`world-card ${open ? 'open' : 'needs-skills'}`} key={w.track} data-testid={`world-${w.track}`} data-state={!open ? 'needs-skills' : started ? 'started' : 'start'}>
              <div class="world-head"><span class="world-icon">{w.icon}</span><strong>{w.name}</strong></div>
              <p class="small muted">{w.blurb}</p>
              {open ? (
                <p class="small">{started ? `${done} of ${list.length} lessons complete` : w.foundation ? 'Open to everyone: start here.' : 'Ready when you are.'}</p>
              ) : (
                <p class="small" data-testid={`world-needs-${w.track}`}>Needs: {gaps.slice(0, 3).map((g) => describeGap(g).split(' → ')[0]).join(' · ')}{gaps.length > 3 ? ` · +${gaps.length - 3} more` : ''}</p>
              )}
              <button class={`btn small ${open && !started ? 'gold' : ''}`} onClick={() => onEnter(w.areaId)} data-testid={`enter-${w.track}`}>{open ? (started ? 'Continue' : 'Start') : 'What is needed?'}</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
