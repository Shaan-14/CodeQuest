import { useState } from 'preact/hooks';
import { getAnyChallenge, getLesson, getSkill } from '../../content';
import { exampleDemoFor, noteFor } from '../../content/trainingNotes';
import type { ReturnPoint, TrainingStep } from '../../core/save';
import { abandonTraining, beginStep, completeReadingStep, planOf, submitTrainingStep, weaknessOf } from '../../game/training';
import { compositeTitle } from '../../game/trainingPlan';
import { getStore, useGame } from '../../game/store';
import { failureDetailOf } from '../../learning/failure';
import { ChallengeStepView, explainFailure } from '../components/ChallengeStep';
import { DemoStepView } from '../components/DemoStep';
import { RichText } from '../components/RichText';

const KIND_LABEL: Record<string, string> = { review: 'Refresher', example: 'Worked example', guided: 'Guided practice', practice: 'Practice', combined: 'Putting it together', independent: 'On your own' };
const LEVEL_LABEL: Record<string, string> = { refresher: 'Quick refresher', targeted: 'Targeted training', extended: 'Extended training', deep: 'Deep training path' };

export function describeReturn(r: ReturnPoint): string {
  if (r.kind === 'lesson' && r.lessonId) return `Back to “${getLesson(r.lessonId)?.title ?? r.lessonId}”, exactly where you left off`;
  if (r.kind === 'boss') return 'Back to the boss gate';
  if (r.kind === 'daily') return 'Back to the Daily Challenge';
  return 'Back to the map';
}

/**
 * One training plan. Training is a detour: the header always says where you will return to, and nothing here changes
 * your lessons, quests or unlocked areas.
 */
export function TrainingRun({ planId, onReturn, onLeave }: { planId: string; onReturn: (r: ReturnPoint) => void; onLeave: () => void }) {
  const { save } = useGame();
  const plan = planOf(save, planId);
  const [begun, setBegun] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  if (!plan) return <main class="scene"><div class="scene-card"><p>That training plan is no longer available.</p><button class="btn" onClick={onLeave}>Back</button></div></main>;
  const w = weaknessOf(save, plan.weaknessId);
  const names = (w?.skillIds ?? []).map((k) => getSkill(k)?.title ?? k).join(' + ');
  const step: TrainingStep | undefined = plan.steps.find((x) => !x.done);
  const doneCount = plan.steps.filter((x) => x.done).length;
  const store = getStore();

  const head = (
    <div class="lesson-head">
      <button class="btn small ghost" onClick={onLeave} data-testid="training-leave">← Leave for now (your plan is saved)</button>
      <h1>🏋️ {LEVEL_LABEL[plan.level]}: {compositeTitle(w!) ?? names}</h1>
      <ol class="dots" aria-label="Training progress">{plan.steps.map((x) => <li key={x.id} class={x.done ? 'done' : x.id === step?.id ? 'current' : ''} title={KIND_LABEL[x.kind]} />)}</ol>
      <p class="muted small" data-testid="training-return">{describeReturn(plan.returnTo)}. Your story progress is untouched: training is a detour, not a step back.</p>
    </div>
  );

  if (plan.status === 'complete' || !step) {
    return (
      <main class="lesson" data-testid="training-run" data-status="complete">
        {head}
        <section class="panel" data-testid="training-complete">
          <h2>💪 Training complete</h2>
          <p>You showed {names} on fresh problems, on your own. That new evidence is on your record next to everything you had before.</p>
          <button class="btn gold" onClick={() => onReturn(plan.returnTo)} data-testid="training-return-btn">{describeReturn(plan.returnTo)} →</button>
        </section>
      </main>
    );
  }

  const c = step.challengeId ? getAnyChallenge(step.challengeId) : undefined;
  const demonstration = step.kind === 'independent' || step.kind === 'combined';
  const start = () => { store.apply(beginStep(store.save, plan.id, step.id)); setBegun(step.id); setNotice(null); };

  return (
    <main class="lesson" data-testid="training-run" data-status="active" data-step-kind={step.kind}>
      {head}
      <p class="muted small" data-testid="training-progress">Step {doneCount + 1} of {plan.steps.length}: {KIND_LABEL[step.kind]}</p>
      {(step.kind === 'review') && (() => {
        const n = noteFor(step.skillId);
        return (
          <section class="panel teach" data-testid="training-note">
            <div class="mode-badge learn">{KIND_LABEL.review}</div>
            <h2>{n.title}</h2>
            <RichText text={n.body} />
            {n.example && <pre class="code-sample">{n.example}</pre>}
            {n.pitfalls.length > 0 && <ul>{n.pitfalls.map((p, i) => <li key={i}>{p}</li>)}</ul>}
            <button class="btn primary" onClick={() => store.apply(completeReadingStep(store.save, plan.id, step.id))} data-testid="training-read">Got it →</button>
          </section>
        );
      })()}
      {step.kind === 'example' && (() => {
        const d = exampleDemoFor(step.skillId);
        const n = noteFor(step.skillId);
        return d ? <DemoStepView key={step.id} step={d} onReady={() => undefined} /> : <section class="panel teach"><h2>{n.title}</h2>{n.example && <pre class="code-sample">{n.example}</pre>}</section>;
      })()}
      {step.kind === 'example' && <div class="lesson-foot"><button class="btn primary" onClick={() => store.apply(completeReadingStep(store.save, plan.id, step.id))} data-testid="training-read">Continue →</button></div>}
      {c && begun !== step.id && (
        <section class="panel" data-testid="training-intro">
          {notice && <p class="callout" data-testid="training-notice">{notice}</p>}
          <h2>{KIND_LABEL[step.kind]}: a fresh problem</h2>
          <p class="small">{demonstration ? 'This one is on your own: no hints. It is a different problem from the one that gave you trouble.' : 'Hints are available here. It is a different problem from the one that gave you trouble.'}</p>
          <button class="btn primary" onClick={start} data-testid="training-start-step">Start</button>
        </section>
      )}
      {c && begun === step.id && (
        <ChallengeStepView
          key={step.id}
          challenge={c}
          onReady={() => undefined}
          onGoAcademy={onLeave}
          noHints={demonstration}
          submitOverride={(graded, ms, code) => {
            if (graded.passed) setNotice('Nice: that one passed.');
            if (!graded.passed && demonstration) setNotice(`That one did not pass yet. ${explainFailure(graded)} No problem: your plan just grew with fresh practice, and nothing is lost.`);
            store.apply(submitTrainingStep(store.save, plan.id, step.id, graded.passed, ms, code, failureDetailOf(graded)));
          }}
          failureNote={demonstration ? 'Nothing is lost. If this needs more practice, the plan adds fresh problems until you can do it alone.' : undefined}
        />
      )}
      <div class="lesson-foot"><button class="btn ghost small" onClick={() => { store.apply(abandonTraining(store.save, plan.id)); onLeave(); }} data-testid="training-abandon">Set this training aside</button></div>
    </main>
  );
}
