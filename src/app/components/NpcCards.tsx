import { npcLine, npcsIn } from '../../content/npcs';
import { quests } from '../../content/world';
import { acceptQuest } from '../../game/actions';
import { questOffered } from '../../game/world';
import { getStore, useGame } from '../../game/store';

/** Characters in an area. Their advice follows the player's progress; none of it is an answer. */
export function NpcCards({ areaId }: { areaId: string }) {
  const { save } = useGame();
  const done = (id: string) => !!save.learning.lessons[id]?.completed;
  return (
    <div class="npc-row">
      {npcsIn(areaId).map((n) => (
        <section key={n.id} class="panel npc-card" data-testid={`npc-${n.id}`}>
          <div class="npc-icon" aria-hidden="true">{n.icon}</div>
          <div>
            <div class="speaker">{n.name} <span class="muted small">· {n.role}</span></div>
            <p>{npcLine(n, done)}</p>
          </div>
        </section>
      ))}
    </div>
  );
}

/** Quests offered by a giver: accept once, progress is by completing lessons. */
export function QuestOffers({ giver, exclude = [] }: { giver: string; exclude?: string[] }) {
  const { save, apply } = useGame();
  const list = quests.filter((q) => q.giver === giver && !exclude.includes(q.id) && questOffered(q, save));
  if (!list.length) return null;
  return (
    <div class="quest-offers">
      {list.map((q) => {
        const st = save.quests[q.id];
        const done = q.objectives.filter((o) => save.learning.lessons[o.lessonId]?.completed).length;
        return (
          <section key={q.id} class="panel" data-testid={`quest-${q.id}`}>
            <div class="quest-line"><strong>📜 {q.title}</strong><span class={`chip ${st?.status ?? 'none'}`}>{st?.status === 'complete' ? 'Complete' : st ? 'In progress' : 'Available'}</span></div>
            <p class="muted">{q.summary}</p>
            {st ? <p class="small muted">{done} of {q.objectives.length} lessons finished. Quest progress tracks lessons, not skill.</p> : <button class="btn" onClick={() => apply(acceptQuest(getStore().save, q.id))} data-testid={`accept-${q.id}`}>Accept quest</button>}
          </section>
        );
      })}
    </div>
  );
}
