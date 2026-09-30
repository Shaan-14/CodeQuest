import { npcLine, npcsIn } from '../../content/npcs';
import { quests } from '../../content/world';
import { useGame } from '../../game/store';
import { QuestCard } from './QuestCard';

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

/** Every quest a giver has, each in its true state (only an available quest has an Accept button). */
export function QuestOffers({ giver, exclude = [] }: { giver: string; exclude?: string[] }) {
  const list = quests.filter((q) => q.giver === giver && !exclude.includes(q.id));
  if (!list.length) return null;
  return <div class="quest-offers">{list.map((q) => <QuestCard key={q.id} quest={q} showObjectives={false} />)}</div>;
}
