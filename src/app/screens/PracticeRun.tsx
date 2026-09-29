import { useState } from 'preact/hooks';
import { getChallenge, getObjective, variantsOf } from '../../content';
import { objectiveOf } from '../../content/helpers';
import { hasAlternate, pickVariant } from '../../game/selection';
import { getStore } from '../../game/store';
import { ChallengeStepView } from '../components/ChallengeStep';

/** One practice problem outside a lesson. "Another problem" rotates through the objective's variants. */
export function PracticeRun({ challengeId, onBack, onGoAcademy }: { challengeId: string; onBack: () => void; onGoAcademy: () => void }) {
  const [currentId, setCurrentId] = useState(challengeId);
  const c = getChallenge(currentId)!;
  const objectiveId = objectiveOf(c);
  const variants = variantsOf(objectiveId);
  return (
    <main class="lesson" data-testid="practice-run">
      <div class="lesson-head">
        <button class="btn small ghost" onClick={onBack}>← Practice Yard</button>
        <h1>Practice: {getObjective(objectiveId)?.title ?? c.title}</h1>
      </div>
      <ChallengeStepView
        key={currentId}
        challenge={c}
        onReady={() => undefined}
        onGoAcademy={onGoAcademy}
        onSwitchVariant={hasAlternate(objectiveId, currentId) ? () => setCurrentId(pickVariant(getStore().save, objectiveId, currentId)!.id) : undefined}
        variantInfo={{ index: variants.findIndex((v) => v.id === currentId), total: variants.length }}
      />
    </main>
  );
}
