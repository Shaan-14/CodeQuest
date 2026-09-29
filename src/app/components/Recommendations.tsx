import { recommendPractice } from '../../game/selection';
import { useGame } from '../../game/store';

interface Props {
  onPractice: (challengeId: string) => void;
  onOpenLesson: (lessonId: string) => void;
  max?: number;
}

/** "What should I do next?", with the reason drawn from the player's own evidence. Nothing hidden. */
export function Recommendations({ onPractice, onOpenLesson, max = 3 }: Props) {
  const { save } = useGame();
  const recs = recommendPractice(save, max);
  if (!recs.length) return null;
  return (
    <section class="panel" data-testid="recommendations">
      <h2>🧭 Mentor’s suggestions</h2>
      <p class="muted small">Suggestions come from your own record: what you failed, what needed hints, what you have not touched for a while.</p>
      <div class="rec-list">
        {recs.map((r) => (
          <div class={`rec ${r.kind}`} key={`${r.kind}-${r.objectiveId ?? r.lessonId}`} data-testid={`rec-${r.kind}`}>
            <div>
              <strong>{r.title}</strong>
              <div class="rec-why">{r.reason}</div>
            </div>
            <button class="btn small" onClick={() => (r.kind === 'next-lesson' ? onOpenLesson(r.lessonId!) : onPractice(r.challengeId!))}>
              {r.kind === 'next-lesson' ? 'Open lesson' : 'Practise'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
