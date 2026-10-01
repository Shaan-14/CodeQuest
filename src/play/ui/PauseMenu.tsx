import type { Stage, Quality } from '../engine/stage';
import { setPlaySettings } from '../../game/play';
import { getStore, useGame } from '../../game/store';

/** Pause: settings that matter for comfort (sound, motion, quality) Saved with the game. */
export function PauseMenu({ onResume, stage }: { onResume: () => void; stage: Stage | null }) {
  const { save } = useGame();
  const s = save.play.settings;
  const set = (patch: Parameters<typeof setPlaySettings>[1]) => getStore().apply(setPlaySettings(getStore().save, patch));
  const reduced = s.reducedMotion ?? (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  return (
    <div class="play-pause" role="dialog" aria-label="Pause menu" data-testid="play-pause">
      <div class="panel">
        <h2>Paused</h2>
        <button class="btn gold" onClick={onResume} data-testid="pause-resume" autoFocus>Resume</button>
        <label class="row"><input type="checkbox" checked={!s.muted} onChange={() => { set({ muted: !s.muted }); stage?.audio.setMuted(!s.muted); }} /> Sound on (sound is never required: everything has text)</label>
        <label class="row"><input type="checkbox" checked={reduced} onChange={() => { set({ reducedMotion: !reduced }); if (stage) { stage.tweens.instant = !reduced; stage.fx.density = !reduced ? 0.35 : 1; } }} /> Reduce motion (effects happen instantly, less shaking)</label>
        <label class="row">Graphics quality
          <select value={s.quality} onChange={(e) => set({ quality: (e.target as HTMLSelectElement).value as Quality })} data-testid="pause-quality">
            <option value="low">Low (fastest)</option><option value="medium">Medium</option><option value="high">High (shadows)</option>
          </select>
        </label>
        <p class="muted small">Quality changes apply the next time the world loads.</p>
      </div>
    </div>
  );
}
