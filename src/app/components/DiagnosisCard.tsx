import { getSkill } from '../../content';
import type { Weakness } from '../../core/save';
import { compositeTitle } from '../../game/trainingPlan';
import { requiredTraining } from '../../game/training';
import { useGame } from '../../game/store';

/** Plain-language names of what a weakness is about ("Loops + Dictionaries + Conditions"). */
export const weaknessNames = (w: Weakness): string => compositeTitle(w) ?? w.skillIds.map((k) => getSkill(k)?.title ?? k).join(' + ');

/**
 * Mentor Juno after a meaningful failure: diagnoses and directs, nothing else. One button, no retry, no second
 * training interface: the training itself happens in the Training Grounds.
 */
export function DiagnosisCard({ weakness, onGoTraining }: { weakness?: Weakness; onGoTraining: () => void }) {
  const { save } = useGame();
  const w = weakness ?? requiredTraining(save);
  if (!w) return null;
  return (
    <div class="diagnosis panel mentor-card" data-testid="diagnosis">
      <strong>🧙 Mentor Juno</strong>
      <p data-testid="diagnosis-what">You struggled with <strong>{weaknessNames(w)}</strong>.</p>
      {w.reasons.length > 0 && <ul class="small">{w.reasons.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}</ul>}
      <p>Your next step is to train this skill before continuing. Your place is saved, and your earlier results stay on your record.</p>
      <button class="btn gold" onClick={onGoTraining} data-testid="go-training">🏋️ Go to the Training Grounds</button>
    </div>
  );
}
