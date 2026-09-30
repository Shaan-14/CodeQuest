import { lazy, Suspense } from 'preact/compat';
import { useState } from 'preact/hooks';
import type { ReturnPoint } from '../../core/save';
import { TrainingYard } from '../../app/screens/TrainingYard';

const TrainingRun = lazy(() => import('../../app/screens/TrainingRun').then((m) => ({ default: m.TrainingRun })));

/**
 * The Training Grounds inside the Simulation Room. It is the same training the classic view offers (same plans, same problems, same Focus
 * rules): this only changes WHERE it happens. Finishing a plan hands the player back to the exact place they were (`onReturn`).
 */
export function TrainingOverlay({ onClose, onReturn }: { onClose: () => void; onReturn: (r: ReturnPoint) => void }) {
  const [planId, setPlanId] = useState<string | null>(null);
  return (
    <div class="play-terminal" role="dialog" aria-label="Training Grounds" data-testid="play-training">
      <div class="term-head">
        <h2>🏋️ Training Grounds</h2>
        <button class="btn small gold" onClick={onClose} data-testid="training-close">Leave the console</button>
      </div>
      <div class="term-body">
        <Suspense fallback={<p class="muted">Loading…</p>}>
          {planId ? <TrainingRun planId={planId} onLeave={() => setPlanId(null)} onReturn={onReturn} /> : <TrainingYard onOpenPlan={setPlanId} onBack={onClose} />}
        </Suspense>
      </div>
    </div>
  );
}
