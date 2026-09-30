import { lessons } from '../../content';
import { describeGap, lessonGaps } from '../../game/graph';
import { isTrial, lessonEvidence, lessonStatus, trackOf, type Track } from '../../game/lessons';
import { useGame } from '../../game/store';

const STATUS_TEXT = { locked: 'Needs skills', available: 'Ready', 'in-progress': 'In progress', complete: 'Complete' } as const;

/** The lessons of one learning world, with honest per-lesson evidence counts and, for any lesson not open yet, exactly what it needs. */
export function LessonList({ track, onOpenLesson }: { track: Track; onOpenLesson: (id: string) => void }) {
  const { save } = useGame();
  const list = lessons.filter((l) => trackOf(l) === track);
  return (
    <ol class="stations">
      {list.map((l, i) => {
        const status = lessonStatus(save, l);
        const ev = lessonEvidence(save, l);
        const trial = isTrial(l);
        const gaps = status === 'locked' ? lessonGaps(save, l) : [];
        return (
          <li key={l.id} class={`station ${status} ${trial ? 'trial' : ''}`} data-testid={`lesson-${l.id}`} data-status={status}>
            <button onClick={() => onOpenLesson(l.id)}>
              <span class="station-num">{trial ? '★' : i + 1}</span>
              <span class="station-main">
                <strong>{l.title}</strong>
                <span class="muted">{trial ? 'Independent trial: a problem and nothing else.' : l.blurb}</span>
                {gaps.length > 0 && <span class="small muted" data-testid={`needs-${l.id}`}>Needs: {gaps.slice(0, 3).map((g) => describeGap(g).split(' → ')[0]).join(' · ')}{gaps.length > 3 ? ` · +${gaps.length - 3} more` : ''}</span>}
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
