import type { Quest } from '../../content/schema';
import { acceptQuest } from '../../game/actions';
import { STATUS_LABEL, nextObjective, objectiveDone, objectiveHint, questProgress, questStatus, unavailableReason } from '../../game/quests';
import { getStore, useGame } from '../../game/store';

/**
 * A quest in any of its five honest states. The Accept button exists ONLY when the quest is really available; an unavailable quest says
 * what must be finished first, an accepted one says what to do next, and a completed one says it is done.
 */
export function QuestCard({ quest, showObjectives = true }: { quest: Quest; showObjectives?: boolean }) {
  const { save, apply } = useGame();
  const status = questStatus(save, quest);
  const { done, total } = questProgress(save, quest);
  const next = nextObjective(save, quest);
  return (
    <section class={`panel quest-card ${status}`} data-testid={`quest-${quest.id}`} data-status={status}>
      <div class="quest-line"><strong>📜 {quest.title}</strong><span class={`chip ${status}`} data-testid={`quest-status-${quest.id}`}>{STATUS_LABEL[status]}</span></div>
      <p class="muted">{quest.summary}</p>
      {status === 'unavailable' && <p class="small muted" data-testid={`quest-reason-${quest.id}`}>{unavailableReason(save, quest)}</p>}
      {status === 'available' && <button class="btn" onClick={() => apply(acceptQuest(getStore().save, quest.id))} data-testid={`accept-${quest.id}`}>Accept quest</button>}
      {(status === 'accepted' || status === 'in-progress') && (
        <p class="small muted" data-testid={`quest-next-${quest.id}`}>{done} of {total} steps done.{next ? <> Next: {next.text}{objectiveHint(next) ? ` (${objectiveHint(next)})` : ''}.</> : null} Quest progress is a milestone, not skill.</p>
      )}
      {status === 'completed' && <p class="small muted">Completed. Reward: {quest.reward.xp} XP and {quest.reward.coins} coins. A finished quest is a milestone, not proof of mastery.</p>}
      {showObjectives && status !== 'unavailable' && status !== 'available' && (
        <ul class="objectives">
          {quest.objectives.map((o) => <li key={o.id} class={objectiveDone(save, o) ? 'done' : ''}>{objectiveDone(save, o) ? '☑' : '☐'} {o.text}</li>)}
        </ul>
      )}
    </section>
  );
}
