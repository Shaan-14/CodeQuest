import { lessons } from '../../content';
import { useGame } from '../../game/store';
import { RichText } from './RichText';

/** Reference cards for completed lessons (compact notes, not tutorials). Also the "research" resource. */
export function NotesList() {
  const { save } = useGame();
  const done = lessons.filter((l) => save.learning.lessons[l.id]?.completed);
  if (!done.length) return <p class="muted">Complete lessons to fill your notebook.</p>;
  return (
    <div class="notes" data-testid="notes">
      {done.map((l) => (
        <article class="note-card" key={l.id}>
          <h3>{l.reference.title}</h3>
          <RichText text={l.reference.body} />
          {l.reference.example && <pre class="code-sample">{l.reference.example}</pre>}
        </article>
      ))}
    </div>
  );
}
