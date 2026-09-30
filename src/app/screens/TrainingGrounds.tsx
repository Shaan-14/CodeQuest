import { useEffect } from 'preact/hooks';
import { quests } from '../../content/world';
import { getRunner } from '../../learning/python/runner';
import { useGame } from '../../game/store';
import { LessonList } from '../components/LessonList';
import { NpcCards } from '../components/NpcCards';
import { Recommendations } from '../components/Recommendations';
import { TrainingHub } from '../components/TrainingHub';
import { returnPointFor } from '../../game/returnPoint';

export function TrainingGrounds({ onOpenLesson, onPractice, onPracticeYard, onOpenPlan }: { onOpenLesson: (id: string) => void; onPractice: (challengeId: string) => void; onPracticeYard: () => void; onOpenPlan: (planId: string) => void }) {
  const { save } = useGame();
  useEffect(() => void getRunner().warmUp().catch(() => undefined), []);
  const quest = quests[0]!;
  const done = quest.objectives.filter((o) => save.learning.lessons[o.lessonId]?.completed).length;
  const power = Math.round((done / quest.objectives.length) * 100);
  const awake = save.quests[quest.id]?.status === 'complete';
  return (
    <main class="scene theme-grounds" data-testid="grounds">
      <div class="scene-card wide">
        <h1 class="scene-title">🤖 Training Grounds</h1>
        <section class="robot panel" data-testid="robot">
          <div class={`robot-body ${awake ? 'awake' : power > 0 ? 'stirring' : 'asleep'}`} aria-hidden="true">
            <div class="robot-eyes"><span /><span /></div>
          </div>
          <div>
            <h2>Bolt-7 {awake ? '— awake!' : '— offline'}</h2>
            <div class="bar power"><div class="bar-fill" style={{ width: `${power}%` }} /><span data-testid="robot-power">Power {power}%</span></div>
            <p class="muted">{awake ? 'Bolt is up and moving, thanks to your code.' : 'Every lesson you finish repairs another part of his control program.'}</p>
          </div>
        </section>
        <div class="row-between">
          <h2>Lessons</h2>
          <button class="btn small" onClick={onPracticeYard} data-testid="practice-yard">🎯 Practice Yard</button>
        </div>
        <TrainingHub returnTo={returnPointFor(save)} onOpenPlan={onOpenPlan} />
        <Recommendations onPractice={onPractice} onOpenLesson={onOpenLesson} max={2} />
        <LessonList track="python" onOpenLesson={onOpenLesson} />
        <NpcCards areaId="training-grounds" />
      </div>
    </main>
  );
}
