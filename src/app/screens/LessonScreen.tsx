import { useState } from 'preact/hooks';
import { getChallenge, getLesson } from '../../content';
import { advanceStep, completeLesson } from '../../game/actions';
import { getStore, useGame } from '../../game/store';
import { ChallengeStepView } from '../components/ChallengeStep';
import { DemoStepView } from '../components/DemoStep';
import { RichText } from '../components/RichText';

interface Props {
  lessonId: string;
  onExit: () => void;
  onGoAcademy: () => void;
}

export function LessonScreen({ lessonId, onExit, onGoAcademy }: Props) {
  const game = useGame();
  const lesson = getLesson(lessonId)!;
  const completed = !!game.save.learning.lessons[lessonId]?.completed;
  const [index, setIndex] = useState(() => (completed ? 0 : Math.min(game.save.learning.lessons[lessonId]?.stepIndex ?? 0, lesson.steps.length - 1)));
  const [ready, setReady] = useState<Record<number, boolean>>({});
  const step = lesson.steps[index]!;
  const last = index === lesson.steps.length - 1;
  const canContinue = step.kind === 'teach' || !!ready[index] || completed;

  const go = (i: number) => {
    setIndex(i);
    const s = getStore();
    s.apply(advanceStep(s.save, lessonId, i));
  };
  const finish = () => {
    const s = getStore();
    s.apply(completeLesson(s.save, lessonId));
    onExit();
  };
  const markReady = () => setReady((r) => (r[index] ? r : { ...r, [index]: true }));

  return (
    <main class="lesson" data-testid="lesson">
      <div class="lesson-head">
        <button class="btn small ghost" onClick={onExit}>← Training Grounds</button>
        <h1>{lesson.title}</h1>
        <ol class="dots" aria-label="Lesson progress">
          {lesson.steps.map((s, i) => (
            <li key={i} class={`${i === index ? 'current' : i < index || completed ? 'done' : ''} ${s.kind}`} title={s.kind === 'challenge' ? 'Challenge' : s.kind === 'demo' ? 'Demonstration' : 'Explanation'} />
          ))}
        </ol>
      </div>

      <div class="lesson-body" key={index} data-step={index} data-kind={step.kind}>
        {step.kind === 'teach' && (
          <section class="panel teach">
            <div class="mode-badge learn">Learning</div>
            <h2>{step.title}</h2>
            <RichText text={step.body} />
          </section>
        )}
        {step.kind === 'demo' && <DemoStepView step={step} onReady={markReady} />}
        {step.kind === 'challenge' && <ChallengeStepView challenge={getChallenge(step.challengeId)!} onReady={markReady} onGoAcademy={onGoAcademy} />}
      </div>

      <div class="lesson-foot">
        <button class="btn" disabled={index === 0} onClick={() => go(index - 1)} data-testid="back">← Back</button>
        {!last ? (
          <button class="btn primary" disabled={!canContinue} onClick={() => go(index + 1)} data-testid="continue">{canContinue ? 'Continue →' : 'Complete this step to continue'}</button>
        ) : (
          <button class="btn gold" disabled={!canContinue} onClick={finish} data-testid="finish">{completed ? 'Back to Training Grounds' : canContinue ? 'Complete lesson ✔' : 'Solve the challenge to finish'}</button>
        )}
      </div>
    </main>
  );
}
