import type { DriveHud as Hud } from '../engine/drive';

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const ms = (t: number | null) => (t === null ? '—' : fmt(t / 1000));

/** The driver's display: speed, lap, times and what the player's own setup work did to the car. Everything is also in text, for screen readers. */
export function DriveHud({ hud, par, onExit }: { hud: Hud | null; par: number; onExit: () => void }) {
  const h = hud;
  const s = h?.setup;
  return (
    <div class="play-drive" data-testid="drive-hud" aria-label="Driving display">
      <div class="play-race pill">
        <span data-testid="drive-lap">Lap {(h?.lap ?? 0) + 1}</span><span data-testid="drive-time">{fmt(h?.lapTime ?? 0)}</span><span>Best {ms(h?.best ?? null)}</span><span>Par {fmt(par)}</span><span>Gate {h?.checkpoint ?? 1}/{h?.checkpoints ?? 6}</span>
      </div>
      <div class="play-hud-speed pill" aria-live="off"><span data-testid="drive-speed">{h?.kmh ?? 0}</span> km/h{h?.surface === 'grass' ? <div style={{ color: '#ffb347', fontSize: '.8rem' }}>off the track!</div> : null}{h?.sliding ? <div style={{ color: '#ff8c8c', fontSize: '.8rem' }}>sliding</div> : null}</div>
      {s && (
        <div class="play-tracker pill" style={{ top: '60px', width: 'min(260px, 34%)' }}>
          <h3>Your setup</h3>
          <div class="step">Grip {(s.grip * 100).toFixed(0)}% · Brakes {(s.brake * 100).toFixed(0)}% · Power {(s.accel * 100).toFixed(0)}% · Aero {(s.aero * 100).toFixed(0)}%</div>
          <div class="hint">Each figure comes from telemetry work you did at the console. Better analysis, better car.</div>
        </div>
      )}
      <div class="play-controls" aria-hidden="true"><span><kbd>W</kbd> accelerate</span><span><kbd>S</kbd> brake / reverse</span><span><kbd>A</kbd><kbd>D</kbd> steer</span><span><kbd>E</kbd> get out (when slow)</span></div>
      <div class="play-buttons"><button class="btn small" onClick={onExit} data-testid="drive-exit">Get out of the car</button></div>
    </div>
  );
}
