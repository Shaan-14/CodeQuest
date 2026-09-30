import { useState } from 'preact/hooks';
import { getAnyChallenge, getLesson } from '../../content';
import { moduleFor } from '../../content/training/modules';
import type { DemoStep } from '../../content/schema';
import { exampleDemoFor, noteFor } from '../../content/trainingNotes';
import type { ReturnPoint, TrainingStep } from '../../core/save';
import { abandonTraining, answerPrediction, beginStep, completeReadingStep, planOf, submitTrainingStep, weaknessOf } from '../../game/training';
import { getStore, useGame } from '../../game/store';
import { failureDetailOf } from '../../learning/failure';
import { ChallengeStepView, explainFailure } from '../components/ChallengeStep';
import { DemoStepView } from '../components/DemoStep';
import { RichText } from '../components/RichText';
import { weaknessNames } from '../components/DiagnosisCard';

const KIND_LABEL: Record<string, string> = { review: 'A different way to see it', example: 'A different example', predict: 'Predict', guided: 'Guided practice', practice: 'Practice', combined: 'Fresh problem (final step)', independent: 'Fresh problem (final step)' };
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
  const names = w ? weaknessNames(w) : '';
  const mod = w ? moduleFor(w.skillIds) : undefined;
  const step: TrainingStep | undefined = plan.steps.find((x) => !x.done);
  const doneCount = plan.steps.filter((x) => x.done).length;
  const store = getStore();

  const head = (
    <div class="lesson-head">
      <button class="btn small ghost" onClick={onLeave} data-testid="training-leave">← Leave for now (your plan is saved)</button>
      <h1>🏋️ Training Grounds: {names}</h1>
      <ol class="dots" aria-label="Training progress">{plan.steps.map((x) => <li key={x.id} class={x.done ? 'done' : x.id === step?.id ? 'current' : ''} title={KIND_LABEL[x.kind]} />)}</ol>
      <p class="muted small" data-testid="training-return">{LEVEL_LABEL[plan.level]}. A detour from your lesson: {describeReturn(plan.returnTo)}. Nothing you did before is erased.</p>
    </div>
  );

  if (plan.status === 'complete' || !step) {
    return (
      <main class="lesson" data-testid="training-run" data-status="complete">
        {head}
        <section class="panel" data-testid="training-complete">
          <h2>💪 Training complete</h2>
          <p>You solved a fresh {names} problem on your own. That evidence sits on your record next to everything you had before.</p>
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
      {step.kind === 'review' && (() => {
        const m = step.skillId && !(w?.skillIds ?? []).includes(step.skillId) ? moduleFor([step.skillId]) : mod;
        const n = noteFor(step.skillId);
        return (
          <section class="panel teach" data-testid="training-note">
            <div class="mode-badge learn">{KIND_LABEL.review}</div>
            <h2>{m?.title ?? n.title}</h2>
            <RichText text={m?.reframe ?? n.body} />
            {!m && n.example && <pre class="code-sample">{n.example}</pre>}
            {(m?.pitfalls ?? n.pitfalls).length > 0 && <ul>{(m?.pitfalls ?? n.pitfalls).map((p, i) => <li key={i}>{p}</li>)}</ul>}
            <button class="btn primary" onClick={() => store.apply(completeReadingStep(store.save, plan.id, step.id))} data-testid="training-read">Got it →</button>
          </section>
        );
      })()}
      {step.kind === 'example' && (() => {
        const ex = mod?.example;
        const d: DemoStep | undefined = ex ? { kind: 'demo', title: ex.title, body: ex.body, code: ex.code, language: ex.language, db: ex.db, fixtures: ex.fixtures, notice: ex.notice } : exampleDemoFor(step.skillId);
        const n = noteFor(step.skillId);
        return (
          <>
            <div class="mode-badge learn">{KIND_LABEL.example}</div>
            {d ? <DemoStepView key={step.id} step={d} onReady={() => undefined} /> : <section class="panel teach"><h2>{n.title}</h2>{n.example && <pre class="code-sample">{n.example}</pre>}</section>}
            <div class="lesson-foot"><button class="btn primary" onClick={() => store.apply(completeReadingStep(store.save, plan.id, step.id))} data-testid="training-read">Continue →</button></div>
          </>
        );
      })()}
      {step.kind === 'predict' && mod?.predict && (
        <PredictStep key={step.id} q={mod.predict} onDone={() => store.apply(answerPrediction(store.save, plan.id, step.id, mod.predict!.correct))} />
      )}
      {c && begun !== step.id && (
        <section class="panel" data-testid="training-intro">
          {notice && <p class="callout" data-testid="training-notice">{notice}</p>}
          <h2>{demonstration ? 'One fresh problem, on your own' : `${KIND_LABEL[step.kind]}: a new problem`}</h2>
          <p class="small">{demonstration ? 'No hints. A new problem in a different setting from the one that gave you trouble. Pass it and you go straight back to your lesson.' : 'Hints are available here. A new problem in a different setting from the one that gave you trouble.'}</p>
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
      {!plan.required && <div class="lesson-foot"><button class="btn ghost small" onClick={() => { store.apply(abandonTraining(store.save, plan.id)); onLeave(); }} data-testid="training-abandon">Set this training aside</button></div>}
    </main>
  );
}

/** A prediction: a wrong pick costs nothing and only asks for another look; the right one shows why, then moves on. */
function PredictStep({ q, onDone }: { q: NonNullable<ReturnType<typeof moduleFor>>['predict'] & object; onDone: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const right = picked === q.correct;
  return (
    <section class="panel" data-testid="training-predict">
      <div class="mode-badge learn">{KIND_LABEL.predict}</div>
      <h2>{q.question}</h2>
      {q.code && <pre class="code-sample">{q.code}</pre>}
      <div class="predict-options">
        {q.options.map((o, i) => <button key={i} class={`btn ${picked === i ? (i === q.correct ? 'gold' : 'bad') : ''}`} disabled={right} onClick={() => setPicked(i)} data-testid={`predict-${i}`}>{o}</button>)}
      </div>
      {picked !== null && !right && <p class="callout small" data-testid="predict-wrong">Not quite. Trace it one line at a time, writing down what each name points at, then pick again. Nothing is lost.</p>}
      {right && (
        <>
          <p class="callout small" data-testid="predict-right">Yes. {q.explain}</p>
          <button class="btn primary" onClick={onDone} data-testid="training-read">Continue →</button>
        </>
      )}
    </section>
  );
}
