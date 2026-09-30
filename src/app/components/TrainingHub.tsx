import { getSkill } from '../../content';
import type { ReturnPoint } from '../../core/save';
import { skillHistory } from '../../game/skillHistory';
import { activePlan, startTraining } from '../../game/training';
import { recordNeed, trainingNeeds, type TrainingNeed } from '../../game/trainingNeeds';
import { getStore, useGame } from '../../game/store';
import { describeReturn } from '../screens/describeReturn';

const CATEGORY_LABEL: Record<number, string> = { 1: 'Weakness', 2: 'Combination', 3: 'Getting rusty', 4: 'Before what is next', 5: 'Worth proving' };

interface Props {
  /** Where the player is in the curriculum right now; training hands them back here. */
  returnTo: ReturnPoint;
  onOpenPlan: (planId: string) => void;
}

/** "The game knows exactly what I need to practise": needs in priority order, each with its reason. */
export function TrainingHub({ returnTo, onOpenPlan }: Props) {
  const { save } = useGame();
  const active = activePlan(save);
  const needs = trainingNeeds(save, Date.now());
  const history = save.training.plans.filter((p) => p.status !== 'active').slice(-6).reverse();

  const begin = (n: TrainingNeed) => {
    const store = getStore();
    const rec = recordNeed(store.save, n);
    store.apply(rec, { silent: true });
    const r = startTraining(store.save, rec.weaknessId!, returnTo);
    store.apply(r);
    const p = activePlan(store.save);
    if (p) onOpenPlan(p.id);
  };

  return (
    <section class="panel training-hub" data-testid="training-hub">
      <h2>🏋️ Training Board</h2>
      <p class="muted small">Training is a detour, never a step back: you keep your place in the story and return to it afterwards. Everything here comes from your own record, with the reason shown.</p>
      {active && (
        <div class="objective" data-testid="training-active">
          <div class="objective-main"><strong>In progress: {active.steps.filter((x) => x.done).length} of {active.steps.length} steps</strong><span class="muted small">{describeReturn(active.returnTo)}</span></div>
          <button class="btn small gold" onClick={() => onOpenPlan(active.id)} data-testid="training-resume">Resume</button>
        </div>
      )}
      {needs.length === 0 && !active && <p class="muted" data-testid="training-empty">Nothing needs attention right now. Keep going: new evidence will show up here when there is something to work on.</p>}
      {needs.slice(0, 6).map((n) => (
        <div class="objective" key={n.id} data-testid={`need-${n.category}`}>
          <div class="objective-main">
            <span><span class="chip none">{CATEGORY_LABEL[n.category]}</span> <strong>{n.title}</strong></span>
            <span class="muted small">{n.reason}</span>
          </div>
          <button class="btn small" disabled={!!active && !(n.weaknessId && active.weaknessId === n.weaknessId)} onClick={() => begin(n)} data-testid={`need-start-${n.category}`}>Train</button>
        </div>
      ))}
      {history.length > 0 && (
        <details class="training-history" data-testid="training-history">
          <summary>Training history</summary>
          {history.map((p) => {
            const w = save.training.weaknesses.find((x) => x.id === p.weaknessId);
            const names = (w?.skillIds ?? []).map((k) => getSkill(k)?.title ?? k).join(' + ');
            const h = w ? skillHistory(save, w.skillIds[0]!) : undefined;
            return <div class="small" key={p.id}>{p.status === 'complete' ? '✔' : '…'} {names}: {p.level} ({p.status}){h && h.previous !== 'none' ? ` · previous independent performance: ${h.previous}` : ''}</div>;
          })}
        </details>
      )}
    </section>
  );
}
