import { getObjective, variantsOf } from '../../content';
import { availableObjectives, lessonOfObjective, objectiveStatus, pickVariant } from '../../game/selection';
import { useGame } from '../../game/store';
import { Recommendations } from '../components/Recommendations';

interface Props {
  onPractice: (challengeId: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onBack: () => void;
}

export function Practice({ onPractice, onOpenLesson, onBack }: Props) {
  const { save } = useGame();
  const avail = availableObjectives(save);
  // Group by lesson, in teaching order (objectives are already in content order).
  const groups = new Map<string, { title: string; ids: string[] }>();
  for (const id of avail) {
    const lesson = lessonOfObjective(id);
    if (!lesson) continue;
    if (!groups.has(lesson.id)) groups.set(lesson.id, { title: lesson.title, ids: [] });
    groups.get(lesson.id)!.ids.push(id);
  }
  return (
    <main class="scene theme-grounds" data-testid="practice">
      <div class="scene-card wide">
        <button class="btn small ghost" onClick={onBack}>← Back</button>
        <h1 class="scene-title">🎯 Practice Yard</h1>
        <p class="muted">Revisit any idea you have reached. Each button picks a <strong>different problem on the same idea</strong> at the same difficulty, so you cannot pass by remembering an answer. Every attempt goes in your record.</p>
        <Recommendations onPractice={onPractice} onOpenLesson={onOpenLesson} />
        {groups.size === 0 && <p class="muted">Finish your first lesson challenges and they will appear here.</p>}
        {[...groups.entries()].map(([lessonId, g]) => (
          <div class="practice-group" key={lessonId}>
            <h3>{g.title}</h3>
            {g.ids.map((id) => {
              const st = objectiveStatus(save, id);
              const o = getObjective(id)!;
              const label = st.tried === 0 ? 'New' : !st.passed ? 'Not passed yet' : st.independentPasses > 0 ? 'Solved independently' : 'Solved with help';
              const cls = st.tried === 0 ? 'none' : !st.passed ? 'attempted' : st.independentPasses > 0 ? 'demonstrated' : 'guided';
              const next = pickVariant(save, id);
              return (
                <div class="objective" key={id} data-testid={`objective-${id}`}>
                  <div class="objective-main">
                    <strong>{o.title}</strong>
                    <span class="muted small">{o.summary}</span>
                    <span class="muted small">{st.tried} of {variantsOf(id).length} problem{variantsOf(id).length === 1 ? '' : 's'} tried{st.failedAttempts ? ` · ${st.failedAttempts} failed attempt${st.failedAttempts > 1 ? 's' : ''}` : ''}</span>
                  </div>
                  <span class={`chip ${cls}`}>{label}</span>
                  <button class="btn small" disabled={!next} onClick={() => next && onPractice(next.id)} data-testid={`practise-${id}`}>Practise</button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </main>
  );
}
