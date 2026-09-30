import { getSkill } from '../../content';
import type { Weakness } from '../../core/save';
import { FAILURE_LEVELS, type FailureLevel } from '../../game/focus';
import { compositeTitle } from '../../game/trainingPlan';
import { planFor, requiredTraining } from '../../game/training';
import { useGame } from '../../game/store';
import { FocusMeter } from './FocusGate';

/** Plain-language names of what a weakness is about ("Loops + Dictionaries + Conditions"). */
export const weaknessNames = (w: Weakness): string => compositeTitle(w) ?? w.skillIds.map((k) => getSkill(k)?.title ?? k).join(' + ');

/**
 * Mentor Juno after a setback: diagnoses and directs, nothing else. One button, no retry, no second training interface:
 * the training itself happens in the Training Grounds, and it is what earns the Focus back.
 */
export function DiagnosisCard({ weakness, onGoTraining }: { weakness?: Weakness; onGoTraining: () => void }) {
  const { save } = useGame();
  const w = weakness ?? requiredTraining(save);
  if (!w) return null;
  const level = (planFor(save, w.id)?.focusLevel ?? w.focusLevel ?? 1) as FailureLevel;
  const major = FAILURE_LEVELS[level]?.weight === 'major';
  return (
    <div class="diagnosis panel mentor-card" data-testid="diagnosis" data-weight={major ? 'major' : 'small'}>
      <strong>🧙 Mentor Juno</strong>
      <p data-testid="diagnosis-what">You struggled with <strong>{weaknessNames(w)}</strong>.</p>
      {w.reasons.length > 0 && <ul class="small">{w.reasons.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}</ul>}
      {major
        ? <p data-testid="diagnosis-next">That was a difficult challenge. You have lost a lot of Focus, and you will need deeper training before you are ready to attempt it again.</p>
        : <p data-testid="diagnosis-next">You lost some Focus on that attempt. Do a quick training exercise to regain it, and you will be ready to try a new version.</p>}
      <FocusMeter />
      <p class="small muted">You need 100 Focus to attempt a challenge. Your place is saved and your earlier results stay on your record.</p>
      <button class="btn gold" onClick={onGoTraining} data-testid="go-training">🏋️ Go to the Training Grounds</button>
    </div>
  );
}
