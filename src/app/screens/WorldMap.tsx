import { areas } from '../../content/world';
import { useGame } from '../../game/store';
import { requiredTraining } from '../../game/training';
import { areaIsFuture, isAreaUnlocked } from '../../game/world';
import { Avatar } from '../components/Avatar';

export function WorldMap({ current, onOpen }: { current: string; onOpen: (areaId: string) => void }) {
  const { save } = useGame();
  const academy = areas.find((a) => a.id === 'academy')!;
  const required = !!requiredTraining(save);
  const here = areas.find((a) => a.id === current) ?? academy;
  return (
    <main class="worldmap-wrap">
      <h1 class="screen-title">The Realm of Bytehaven</h1>
      <div class="worldmap" data-testid="worldmap">
        <div class="map-land" aria-hidden="true" />
        <svg class="map-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {areas.filter((a) => a.id !== 'academy').map((a) => (
            <line key={a.id} x1={academy.pos.x} y1={academy.pos.y} x2={a.pos.x} y2={a.pos.y} class={a.id === 'training-yard' && required ? 'required' : isAreaUnlocked(a, save) ? 'open' : 'sealed'} />
          ))}
        </svg>
        {areas.map((a) => {
          const open = isAreaUnlocked(a, save);
          return (
            <button key={a.id} class={`pin theme-${a.theme} ${open ? 'open' : 'locked'} ${areaIsFuture(a) ? 'future' : ''} ${a.id === 'training-yard' && required ? 'required' : ''}`} style={{ left: `${a.pos.x}%`, top: `${a.pos.y}%` }} onClick={() => onOpen(a.id)} data-testid={`area-${a.id}`} aria-label={`${a.name}${open ? '' : ' (locked)'}`}>
              <span class="pin-icon">{open ? a.icon : '🔒'}</span>
              <span class="pin-label">{a.name}{a.id === 'training-yard' && required ? ' (needed)' : ''}</span>
            </button>
          );
        })}
        {save.player && (
          <div class="map-hero" style={{ left: `${here.pos.x + 4}%`, top: `${here.pos.y - 10}%` }} aria-hidden="true">
            <Avatar avatar={save.player.avatar} size={40} cape={!!save.inventory['explorer-cape']} cap={!!save.inventory['lucky-cap']} />
          </div>
        )}
      </div>
      <p class="muted center">Locked places open as you progress or in future updates. Select any place to visit it.</p>
    </main>
  );
}
