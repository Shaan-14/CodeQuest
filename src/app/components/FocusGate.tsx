import { MAX_FOCUS } from '../../core/save';
import { useGame } from '../../game/store';

/** Focus as a readiness meter: the number, the bar and what is still needed. */
export function FocusMeter({ compact = false }: { compact?: boolean }) {
  const { save } = useGame();
  const f = save.stats.focus;
  return (
    <div class="focus-meter" data-testid="focus-meter" data-focus={f}>
      <div class="bar focus"><div class="bar-fill" style={{ width: `${(f / MAX_FOCUS) * 100}%` }} /><span>Focus {f} / {MAX_FOCUS}</span></div>
      {!compact && f < MAX_FOCUS && <p class="small muted" data-testid="focus-needed">Focus needed: {MAX_FOCUS - f}</p>}
    </div>
  );
}

/**
 * The one message for "you cannot attempt this yet": Focus is below 100. Not a lock on the game (the player can still
 * explore, read, and train): only attempting graded work waits for Focus.
 */
export function NotReadyPanel({ onGoTraining }: { onGoTraining?: () => void }) {
  return (
    <div class="not-ready panel" role="status" data-testid="not-ready">
      <h3>⏳ Not ready</h3>
      <p><strong>{MAX_FOCUS} Focus required</strong> to attempt a challenge. Your Focus is below {MAX_FOCUS}: train to regain it before trying again.</p>
      <FocusMeter />
      {onGoTraining && <button class="btn gold" onClick={onGoTraining} data-testid="go-training">🏋️ Go to the Training Grounds</button>}
    </div>
  );
}
