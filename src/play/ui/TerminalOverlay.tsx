import { lazy, Suspense } from 'preact/compat';
import { useState } from 'preact/hooks';
import { getLesson } from '../../content';
import type { Station } from '../../content/play/stations';
import { lessonAccess } from '../../game/graph';
import { lessonStatus } from '../../game/lessons';
import { requiredTraining } from '../../game/training';
import { useGame } from '../../game/store';
import { DiagnosisCard } from '../../app/components/DiagnosisCard';

const LessonScreen = lazy(() => import('../../app/screens/LessonScreen').then((m) => ({ default: m.LessonScreen })));

const STATE_ICON: Record<string, string> = { complete: '✅', 'in-progress': '🔧', available: '▶', locked: '🔒' };

/** The first module the player has not finished (or the last one, to review). */
export function nextModule(station: Station, isDone: (id: string) => boolean): string {
  return station.lessons.find((id) => !isDone(id)) ?? station.lessons[station.lessons.length - 1]!;
}

/**
 * A terminal in the world. It opens the REAL lesson (explanation, demo, guided practice, graded challenges) in a real editor. Closing it puts
 * the player back in the world, where the consequences of what they wrote play out.
 */
export function TerminalOverlay({ station, onClose, onGoTraining }: { station: Station; onClose: () => void; onGoTraining: () => void }) {
  const { save } = useGame();
  const [lessonId, setLessonId] = useState<string | null>(null);
  const blocker = requiredTraining(save);
  const done = (id: string) => !!save.learning.lessons[id]?.completed;
  const next = nextModule(station, done);
  return (
    <div class="play-terminal" role="dialog" aria-label={station.title} data-testid="play-terminal">
      <div class="term-head">
        <h2>🖥️ {station.title}</h2>
        {lessonId && <button class="btn small" onClick={() => setLessonId(null)} data-testid="terminal-modules">Modules</button>}
        <button class="btn small gold" onClick={onClose} data-testid="terminal-close">Leave terminal</button>
      </div>
      <div class="term-body">
        {lessonId ? (
          <Suspense fallback={<p class="muted">Loading…</p>}>
            <LessonScreen lessonId={lessonId} onExit={() => setLessonId(null)} onGoAcademy={onClose} onGoTraining={onGoTraining} onOpenLesson={(id) => setLessonId(id)} />
          </Suspense>
        ) : (
          <>
            <p class="muted">{station.blurb}</p>
            {blocker && <section class="panel blocked" data-testid="terminal-blocked"><h3>⏳ Not ready</h3><p class="muted small">Your Focus is below 100. The console will still be here: train first.</p><DiagnosisCard weakness={blocker} onGoTraining={onGoTraining} /></section>}
            <button class="btn gold" onClick={() => setLessonId(next)} data-testid="terminal-next">▶ {done(next) ? 'Review' : 'Open'} module: {getLesson(next)?.title}</button>
            <div class="modules" role="list">
              {station.lessons.map((id) => {
                const l = getLesson(id)!;
                const st = lessonStatus(save, l);
                const open = lessonAccess(save, l).open || done(id);
                return (
                  <button key={id} class="btn" role="listitem" onClick={() => setLessonId(id)} data-testid={`module-${id}`} data-state={st}>
                    <span class="mod-state" aria-hidden="true">{STATE_ICON[open ? st : 'locked']}</span>
                    <span><strong>{l.title}</strong><br /><span class="muted small">{l.blurb}</span></span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
