import { worldOfTrack } from '../../content/worlds';
import type { SkillReq } from '../../content/schema';
import { LEVEL_WORDS, reportFor, type ReqStatus } from '../../game/graph';
import { useGame } from '../../game/store';

interface Props {
  /** What the player is trying to reach (a lesson or an area name). */
  title: string;
  reqs?: SkillReq[];
  prerequisiteLessons?: string[];
  /** Plain reason from the content, shown when present. */
  reason?: string;
  /** Open the lesson that teaches a missing competency. */
  onOpenLesson: (lessonId: string) => void;
  onBack: () => void;
  backLabel?: string;
}

const worldName = (t: ReqStatus['track']) => worldOfTrack(t).name.split(':')[0]!;

/**
 * The answer to "why can't I do this yet?": what the player HAS shown, exactly what is missing, where to learn it, and
 * what it opens. Never a dead end and never "finish Python first": every line names a competency and a lesson.
 */
export function PrerequisitePanel({ title, reqs, prerequisiteLessons, reason, onOpenLesson, onBack, backLabel = 'Back' }: Props) {
  const { save } = useGame();
  const items = reportFor(save, reqs, prerequisiteLessons);
  const have = items.filter((i) => i.ok);
  const missing = items.filter((i) => !i.ok);
  const worlds = [...new Set(items.map((i) => worldName(i.track)))];
  return (
    <section class="panel prereq" data-testid="prerequisites">
      <h2>🧩 Prerequisite required</h2>
      <p data-testid="prereq-intro">
        {worlds.length > 1 ? `“${title}” combines ${worlds.join(' and ')}.` : `“${title}” builds on skills you have not shown yet.`}{' '}
        {reason ?? ''}
      </p>
      {have.length > 0 && (
        <div data-testid="prereq-have">
          <strong>You have shown:</strong>
          <ul class="small">{have.map((i) => <li key={i.title}>✔ {worldName(i.track)}: {i.title}</li>)}</ul>
        </div>
      )}
      <div data-testid="prereq-missing">
        <strong>You still need:</strong>
        <ul class="prereq-list">
          {missing.map((i) => (
            <li key={i.title} data-testid="prereq-item">
              <span><strong>{worldName(i.track)}: {i.title}</strong>{i.need !== 'introduced' || i.have !== 'none' ? <span class="muted small"> ({LEVEL_WORDS[i.have]} → {LEVEL_WORDS[i.need]})</span> : null}</span>
              {i.gap?.teach && <button class="btn small gold" onClick={() => onOpenLesson(i.gap!.teach!.lessonId)} data-testid="prereq-go">Go to “{i.gap.teach.lessonTitle}”</button>}
            </li>
          ))}
        </ul>
      </div>
      <p class="muted small">Show these competencies and “{title}” becomes available. Everything else in CodeQuest stays open: explore another world while you work towards it.</p>
      <button class="btn ghost" onClick={onBack}>{backLabel}</button>
    </section>
  );
}
