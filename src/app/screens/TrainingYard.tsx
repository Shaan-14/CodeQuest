import { useEffect } from 'preact/hooks';
import { returnPointFor } from '../../game/returnPoint';
import { getStore, useGame } from '../../game/store';
import { activePlan, planFor, requiredTraining, startTraining } from '../../game/training';
import { FocusMeter } from '../components/FocusGate';
import { TrainingHub } from '../components/TrainingHub';
import { weaknessNames } from '../components/DiagnosisCard';
import { describeReturn } from './describeReturn';

/**
 * THE TRAINING GROUNDS: a place of its own on the map, apart from every lesson area. When training is required this
 * screen shows ONE thing (why you are here, where you return, one button). Otherwise it is the optional Training Board.
 */
export function TrainingYard({ onOpenPlan, onBack }: { onOpenPlan: (planId: string) => void; onBack: () => void }) {
  const { save } = useGame();
  const w = requiredTraining(save);
  const plan = w ? planFor(save, w.id) : undefined;

  // Older or interrupted saves: a required weakness must always have its plan waiting here.
  useEffect(() => {
    if (!w || (plan && plan.status === 'active')) return;
    const st = getStore();
    st.apply(startTraining(st.save, w.id, returnPointFor(st.save)), { silent: true });
  }, [w?.id, plan?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = w ? planFor(save, w.id) : undefined;
  return (
    <main class="scene theme-yard" data-testid="training-yard" data-required={w ? 'yes' : 'no'}>
      <div class="scene-card">
        <h1 class="scene-title">🏋️ Training Grounds</h1>
        {w ? (
          <section class="panel required-training" data-testid="required-training">
            <p class="muted small">Where you are: the Training Grounds, a detour from the curriculum.</p>
            <h2>Earn your Focus back: {weaknessNames(w)}</h2>
            {w.reasons.length > 0 && <ul class="small">{w.reasons.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}</ul>}
            <FocusMeter />
            <p>What you will do: short training steps, each earning Focus, ending with <strong>one fresh problem on your own</strong>. At 100 Focus you are ready to try again.</p>
            {active && <p class="muted small" data-testid="yard-return">{describeReturn(active.returnTo)}. Progress: {active.steps.filter((x) => x.done).length} of {active.steps.length} steps done.</p>}
            <button class="btn gold" disabled={!active} onClick={() => active && onOpenPlan(active.id)} data-testid="start-training">{active && active.steps.some((x) => x.done) ? 'Continue training →' : 'Start training →'}</button>
          </section>
        ) : (
          <>
            <p class="muted center">Nothing is required right now. This is where targeted training happens: after a struggle, and whenever you want to sharpen something. You always leave with your place in the story exactly as it was.</p>
            <TrainingHub returnTo={returnPointFor(save)} onOpenPlan={onOpenPlan} />
            {activePlan(save) === undefined && <button class="btn ghost small" onClick={onBack}>← Back to the Academy</button>}
          </>
        )}
      </div>
    </main>
  );
}
