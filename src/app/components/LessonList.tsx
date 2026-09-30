import { lessons } from '../../content';
import { isTrial, lessonEvidence, lessonStatus, trackOf, type Track } from '../../game/lessons';
import { useGame } from '../../game/store';

const STATUS_TEXT = { locked: 'Locked', available: 'Ready', 'in-progress': 'In progress', complete: 'Complete' } as const;

/** The ordered lessons of one part of the world, with honest per-lesson evidence counts. */
export function LessonList({ track, onOpenLesson }: { track: Track; onOpenLesson: (id: string) => void }) {
  const { save } = useGame();
  const list = lessons.filter((l) => trackOf(l) === track);
  return (
    <ol class="stations">
      {list.map((l, i) => {
        const status = lessonStatus(save, l);
        const ev = lessonEvidence(save, l);
        const trial = isTrial(l);
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
  );
}
