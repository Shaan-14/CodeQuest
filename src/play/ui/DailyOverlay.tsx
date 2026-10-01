import { lazy, Suspense } from 'preact/compat';
import { useState } from 'preact/hooks';
import { getAnyChallenge } from '../../content';
import { DailyScreen } from '../../app/screens/DailyScreen';
import { useGame } from '../../game/store';

const DailyRun = lazy(() => import('../../app/screens/DailyRun').then((m) => ({ default: m.DailyRun })));

/** The in-world framing of the day's challenge: an urgent request from somewhere in Bytehaven. Presentation only: the Daily's rules are untouched. */
function dispatch(challengeId: string | undefined): string {
  const c = challengeId ? getAnyChallenge(challengeId) : undefined;
  switch (c?.language) {
    case 'python': return '📻 Dispatch: an emergency call from the Robotics Academy: something is broken and the engineers need a program.';
    case 'web': return '📻 Dispatch: a mystery in Lanternhollow: a page is lying and the Warden wants to know why.';
    case 'sql': return '📻 Dispatch: Harborview Park’s analysts have a question for the database and no time.';
    case 'sheet': return '📻 Dispatch: telemetry trouble at the Redline Raceway: the numbers do not add up.';
    case 'r': return '📻 Dispatch: the laboratory needs an analysis run on data nobody has seen before.';
    case 'git': return '📻 Dispatch: a repository somewhere in Bytehaven is in a mess.';
    default: return '📻 Dispatch: a request from somewhere in Bytehaven.';
  }
}

/**
 * The dispatch board: today's Daily Challenge, as a call that came in. It is the same one-attempt, no-hints, no-Focus-cost challenge as in the
 * classic view, drawn from everything the player has been taught.
 */
export function DailyOverlay({ onClose, onGoTraining }: { onClose: () => void; onGoTraining: () => void }) {
  const { save } = useGame();
  const [running, setRunning] = useState(false);
  return (
    <div class="play-terminal" role="dialog" aria-label="Dispatch board" data-testid="play-daily">
      <div class="term-head">
        <h2>📋 Dispatch board</h2>
        <button class="btn small gold" onClick={onClose} data-testid="daily-overlay-close">Leave the board</button>
      </div>
      <div class="term-body">
        <p class="muted" data-testid="dispatch-line">{dispatch(save.daily.current?.challengeId)}</p>
        <Suspense fallback={<p class="muted">Loading…</p>}>
          {running ? <DailyRun onBack={() => setRunning(false)} onGoTraining={onGoTraining} /> : <DailyScreen onStart={() => setRunning(true)} />}
        </Suspense>
      </div>
    </div>
  );
}
