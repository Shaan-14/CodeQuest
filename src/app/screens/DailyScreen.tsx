import { getAnyChallenge } from '../../content';
import { difficultyName } from '../../game/dailySelect';
import { useGame } from '../../game/store';
import { DailyCard } from '../components/DailyCard';

/** The Daily Challenge page: today's offer plus an honest history (missed days are just blank, never punished). */
export function DailyScreen({ onStart }: { onStart: () => void }) {
  const { save } = useGame();
  const history = [...save.daily.history].reverse().slice(0, 20);
  const passed = save.daily.history.filter((h) => h.outcome === 'passed').length;
  const attempted = save.daily.history.filter((h) => h.outcome !== 'missed').length;
  return (
    <main class="scene theme-academy" data-testid="daily-screen">
      <div class="scene-card">
        <h1 class="scene-title">🌅 Daily Challenge</h1>
        <p class="muted center">Every 12 hours: one problem, no hints, one submission. It exists to help you keep what you have learned, including things from long ago. It is optional, and missing one costs nothing.</p>
        <DailyCard onStart={onStart} />
        <section class="panel">
          <h2>Your record</h2>
          <p class="muted small" data-testid="daily-stats">{passed} solved of {attempted} attempted. Daily results are evidence like any other and never mark a skill mastered on their own.</p>
          {history.length === 0 ? <p class="muted">Nothing yet.</p> : (
            <ul class="daily-history" data-testid="daily-history">
              {history.map((h, i) => (
                <li key={`${h.issuedAt}-${i}`}>
                  <span class={`chip ${h.outcome === 'passed' ? 'complete' : h.outcome === 'failed' ? 'locked' : 'available'}`}>{h.outcome === 'passed' ? 'Solved' : h.outcome === 'failed' ? 'Attempted' : 'Skipped'}</span>{' '}
                  {getAnyChallenge(h.challengeId)?.title ?? h.challengeId} <span class="muted small">· {h.category} · {difficultyName(h.difficulty)} · {new Date(h.issuedAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
