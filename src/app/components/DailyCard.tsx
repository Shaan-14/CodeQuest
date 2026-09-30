import { getAnyChallenge } from '../../content';
import { difficultyName } from '../../game/dailySelect';
import { dailySkillTitle, formatRemaining, timeRemainingMs } from '../../game/daily';
import { useGame } from '../../game/store';
import { useNow } from './useDailyClock';

/** The Daily Challenge offer: skill, difficulty, reward, timer and status. Used on the Academy and the daily screen. */
export function DailyCard({ onStart, compact = false }: { onStart: () => void; compact?: boolean }) {
  const { save } = useGame();
  const now = useNow();
  const cur = save.daily.current;
  const passed = save.daily.history.filter((h) => h.outcome === 'passed').length;
  if (!cur) {
    return (
      <section class="panel daily-card" data-testid="daily-card" data-state="none">
        <h2>🌅 Daily Challenge</h2>
        <p class="muted">Finish your first lesson and a Daily Challenge will appear here. A new one arrives every 12 hours; there is no pressure to do them all.</p>
      </section>
    );
  }
  const c = getAnyChallenge(cur.challengeId);
  const remaining = formatRemaining(timeRemainingMs(save, now));
  return (
    <section class={`panel daily-card ${cur.status}`} data-testid="daily-card" data-state={cur.status}>
      <div class="row-between">
        <h2>🌅 Daily Challenge</h2>
        <span class={`chip ${cur.status === 'open' ? 'in-progress' : cur.status === 'passed' ? 'complete' : 'locked'}`} data-testid="daily-status">
          {cur.status === 'open' ? 'Ready' : cur.status === 'passed' ? 'Solved' : 'Attempted'}
        </span>
      </div>
      <p class="daily-title"><strong data-testid="daily-title">{c?.title ?? cur.challengeId}</strong></p>
      <p class="muted small" data-testid="daily-meta">{cur.category} · {dailySkillTitle(cur.skillId)} · Difficulty: {difficultyName(cur.difficulty)} · {cur.focus === 'review' ? 'Review' : 'Current learning'}</p>
      {!compact && <p class="small" data-testid="daily-reason">{cur.reason}</p>}
      <p class="small" data-testid="daily-reward">Reward for a solve: 🪙 +{cur.reward.coins} · ✨ +{cur.reward.xp} XP · 🍵 +{cur.reward.focus} Focus</p>
      {cur.status === 'open' ? (
        <>
          <p class="small muted">No hints. One submission. If you do not solve it, nothing is lost and it simply expires.</p>
          <button class="btn gold" onClick={onStart} data-testid="daily-start">Start today’s challenge</button>
        </>
      ) : (
        <p class="small muted" data-testid="daily-done">{cur.status === 'passed' ? 'Solved without hints, in one attempt. ' : 'Attempted. The result is in your record; there are no retries. '}</p>
      )}
      <p class="small" data-testid="daily-timer">Next challenge in: <strong>{remaining}</strong></p>
      {!compact && <p class="small muted">Solved so far: {passed}</p>}
    </section>
  );
}
