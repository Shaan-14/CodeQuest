import { worlds3d, worldOfScene } from '../../content/play/worlds3d';
import { quests } from '../../content/world';
import { questStatus } from '../../game/quests';
import { useGame } from '../../game/store';
import { canUseExit } from '../logic/travel';
import { getScene } from '../../content/play/scenes';

/**
 * The world map: which worlds are open, which are waiting on a skill (and which), where you are, what is active, what is done. Fast travel is
 * a convenience, never a shortcut past a gate: a closed world says exactly what it needs, like the doors do.
 */
export function MapOverlay({ sceneId, onClose, onTravel }: { sceneId: string; onClose: () => void; onTravel: (scene: string, spawn: string) => void }) {
  const { save } = useGame();
  const here = worldOfScene(sceneId);
  return (
    <div class="play-map" role="dialog" aria-label="World map" data-testid="play-map">
      <div class="term-head" style={{ position: 'static', background: 'transparent', border: 'none' }}>
        <h2 style={{ flex: 1 }}>🗺️ World map</h2>
        <button class="btn small gold" onClick={onClose} data-testid="map-close">Close</button>
      </div>
      <p class="muted">You are in <strong>{getScene(sceneId)?.title ?? '…'}</strong>. Every foundation world is open; some places ask for a skill you have shown, and say which.</p>
      <div class="map-grid">
        {worlds3d.map((w) => {
          const gate = canUseExit(save, { area: w.area, requires: w.requires, label: w.name });
          const qs = w.quests.map((id) => quests.find((q) => q.id === id)!).filter(Boolean);
          const done = qs.filter((q) => questStatus(save, q) === 'completed').length;
          const active = qs.filter((q) => { const s = questStatus(save, q); return s === 'accepted' || s === 'in-progress'; });
          const built = w.scenes.every((s) => !!getScene(s));
          return (
            <section key={w.id} class={`world-tile ${here?.id === w.id ? 'here' : ''} ${gate.ok && built ? '' : 'closed'}`} data-testid={`map-${w.id}`} data-state={!built ? 'soon' : gate.ok ? 'open' : 'closed'}>
              <h3>{w.icon} {w.name} {here?.id === w.id && <span class="pill" style={{ fontSize: '.7rem' }}>you are here</span>}</h3>
              <div>{w.tagline}</div>
              <div class="tile-status">Teaches: {w.teaches}</div>
              {qs.length > 0 && <div class="tile-status">Story: {done} of {qs.length} quests done{active.length ? ` · active: ${active.map((q) => q.title).join(', ')}` : ''}</div>}
              {!gate.ok && <div class="tile-status" data-testid={`map-gate-${w.id}`}>🔒 {gate.reason}</div>}
              {!built && <div class="tile-status">Not built in this version.</div>}
              <button class="btn" disabled={!gate.ok || !built} onClick={() => onTravel(w.entry.scene, w.entry.spawn)} data-testid={`travel-${w.id}`}>{here?.id === w.id ? 'Go to the entrance' : 'Travel there'}</button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
