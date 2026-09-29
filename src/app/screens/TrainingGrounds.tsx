import { useEffect } from 'preact/hooks';
import { lessons } from '../../content';
import { quests } from '../../content/world';
import { getRunner } from '../../learning/python/runner';
import { lessonEvidence, lessonStatus } from '../../game/lessons';
import { useGame } from '../../game/store';
import { Recommendations } from '../components/Recommendations';

const STATUS_TEXT = { locked: 'Locked', available: 'Ready', 'in-progress': 'In progress', complete: 'Complete' } as const;

export function TrainingGrounds({ onOpenLesson, onPractice, onPracticeYard }: { onOpenLesson: (id: string) => void; onPractice: (challengeId: string) => void; onPracticeYard: () => void }) {
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
        <Recommendations onPractice={onPractice} onOpenLesson={onOpenLesson} max={2} />
        <ol class="stations">
          {lessons.map((l, i) => {
            const status = lessonStatus(save, l);
            const ev = lessonEvidence(save, l);
            const trial = l.id === 'py-14-independent-trial';
            const missingId = l.prerequisites.find((p) => !save.learning.lessons[p]?.completed);
            const missing = lessons.find((x) => x.id === missingId)?.title;
            return (
              <li key={l.id} class={`station ${status} ${trial ? 'trial' : ''}`} data-testid={`lesson-${l.id}`}>
                <button disabled={status === 'locked'} onClick={() => onOpenLesson(l.id)}>
                  <span class="station-num">{trial ? '★' : i + 1}</span>
                  <span class="station-main">
                    <strong>{l.title}</strong>
                    <span class="muted">{trial ? 'Independent trial: a problem and nothing else.' : l.blurb}</span>
                    {status === 'locked' && <span class="small muted">Finish “{missing}” first.</span>}
                  </span>
                  <span class="station-meta">
                    <span class={`chip ${status}`}>{STATUS_TEXT[status]}</span>
                    {status !== 'locked' && ev.total > 0 && <span class="small muted">{ev.passed}/{ev.total} solved · {ev.independent} independent</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
