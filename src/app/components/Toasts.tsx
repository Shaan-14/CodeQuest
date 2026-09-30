import { useEffect } from 'preact/hooks';
import { achievementDefs, items, areas, quests } from '../../content/world';
import type { GameEvent } from '../../game/events';
import { getStore, useGame } from '../../game/store';

function describe(e: GameEvent): { icon: string; title: string; body?: string; kind: string } | null {
  switch (e.type) {
    case 'xp': return { icon: '✨', title: `+${e.amount} XP`, body: e.note, kind: 'xp' };
    case 'coins': return { icon: '🪙', title: `+${e.amount} coins`, kind: 'coins' };
    case 'levelUp': return { icon: '⭐', title: `Level ${e.level}!`, body: 'Levels track your adventure, not your skill.', kind: 'level' };
    case 'achievement': {
      const a = achievementDefs.find((x) => x.id === e.id);
      return a ? { icon: a.icon, title: `Achievement: ${a.title}`, body: a.description, kind: 'ach' } : null;
    }
    case 'areaUnlocked': {
      const a = areas.find((x) => x.id === e.id);
      return a && a.id !== 'academy' ? { icon: a.icon, title: `${a.name} unlocked`, kind: 'area' } : null;
    }
    case 'questAccepted': return { icon: '📜', title: 'Quest accepted', body: quests.find((q) => q.id === e.id)?.title, kind: 'quest' };
    case 'questComplete': return { icon: '🏅', title: 'Quest complete!', body: quests.find((q) => q.id === e.id)?.title, kind: 'quest' };
    case 'lessonComplete': return { icon: '📘', title: 'Lesson complete', kind: 'lesson' };
    case 'item': {
      const i = items.find((x) => x.id === e.id);
      return i ? { icon: i.icon, title: i.name, body: 'Added to your pack', kind: 'item' } : null;
    }
    case 'focusLost': return { icon: '💤', title: `-${e.amount} Focus`, kind: 'focus' };
    case 'focusGained': return { icon: '🍵', title: `+${e.amount} Focus`, kind: 'focus' };
    case 'dailyPassed': return { icon: '🌅', title: 'Daily Challenge solved!', body: 'Solved without hints, in one attempt.', kind: 'daily' };
    case 'weaknessFound': return { icon: '🎯', title: 'Something to work on', body: 'Open the Training Grounds to see what and why.', kind: 'training' };
    case 'weaknessDeepened': return { icon: '🎯', title: 'Training focus updated', body: 'The evidence points to a deeper gap.', kind: 'training' };
    case 'weaknessResolved': return { icon: '🌱', title: 'Improvement shown', body: 'You solved a fresh problem on your own.', kind: 'training' };
    case 'trainingStarted': return { icon: '🏋️', title: 'Training started', body: 'Your place in the story is saved.', kind: 'training' };
    case 'trainingStep': return { icon: '✅', title: 'Training step done', kind: 'training' };
    case 'trainingComplete': return { icon: '💪', title: 'Training complete', body: 'Time to return to where you were.', kind: 'training' };
    case 'bossPassed': return { icon: '👑', title: 'Boss defeated!', kind: 'boss' };
    case 'bossFailed': return { icon: '🩹', title: 'Boss not yet beaten', body: 'Diagnosis and training are waiting at the Training Grounds.', kind: 'boss' };
    case 'campaignComplete': return { icon: '🏔️', title: 'You reached the Summit!', body: 'CodeQuest complete.', kind: 'boss' };
    case 'dailyFailed': return { icon: '🌙', title: 'Daily Challenge attempted', body: 'No penalty. A fresh one arrives soon.', kind: 'daily' };
  }
}

function Toast({ id, event }: { id: number; event: GameEvent }) {
  useEffect(() => {
    const t = setTimeout(() => getStore().dismissToast(id), event.type === 'levelUp' || event.type === 'achievement' ? 5000 : 3200);
    return () => clearTimeout(t);
  }, [id, event.type]);
  const d = describe(event);
  if (!d) return null;
  return (
    <div class={`toast toast-${d.kind}`} role="status" onClick={() => getStore().dismissToast(id)}>
      <span class="toast-icon">{d.icon}</span>
      <div>
        <div class="toast-title">{d.title}</div>
        {d.body && <div class="toast-body">{d.body}</div>}
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useGame();
  const levelUp = toasts.find((t) => t.event.type === 'levelUp');
  return (
    <>
      <div class="toasts" data-testid="toasts">
        {toasts.slice(-5).map((t) => <Toast key={t.id} id={t.id} event={t.event} />)}
      </div>
      {levelUp && levelUp.event.type === 'levelUp' && (
        <div class="levelup" onClick={() => getStore().dismissToast(levelUp.id)} data-testid="levelup">
          <div class="levelup-card">
            <div class="levelup-star">⭐</div>
            <h2>Level {levelUp.event.level}</h2>
            <p>Your adventure grows. Remember: level is progress through the game, not proof of skill. Your Skills page shows the real evidence.</p>
          </div>
        </div>
      )}
    </>
  );
}
