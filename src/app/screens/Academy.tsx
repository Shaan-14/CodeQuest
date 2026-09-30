import { useState } from 'preact/hooks';
import { introDialogue, mentorAdvice } from '../../content/mentor';
import { quests } from '../../content/world';
import { acceptQuest, setFlag } from '../../game/actions';
import { useGame, getStore } from '../../game/store';
import { DailyCard } from '../components/DailyCard';
import { WorldChooser } from '../components/WorldChooser';
import { QuestOffers } from '../components/NpcCards';

function Juno() {
  return (
    <div class="npc" aria-hidden="true">
      <svg viewBox="0 0 64 64" width="96" height="96">
        <path d="M14 58 Q32 20 50 58 Z" fill="#7b4fbf" />
        <path d="M24 58 L32 40 L40 58 Z" fill="#f2c14e" />
        <circle cx="32" cy="24" r="10" fill="#e8b98d" />
        <path d="M20 22 Q32 -2 44 22 Q32 14 20 22 Z" fill="#cfd3dc" />
        <path d="M14 22 L32 6 L50 22 Z" fill="#7b4fbf" />
        <circle cx="28" cy="25" r="1.5" fill="#1b1b2f" />
        <circle cx="36" cy="25" r="1.5" fill="#1b1b2f" />
        <path d="M28 30 Q32 33 36 30" stroke="#7a3f2b" stroke-width="1.3" fill="none" stroke-linecap="round" />
      </svg>
    </div>
  );
}

export function Academy({ onGo, onDaily }: { onGo: (route: 'map' | string) => void; onDaily: () => void }) {
  const game = useGame();
  const { save } = game;
  const name = save.player?.name ?? 'Adventurer';
  const [line, setLine] = useState(0);
  const quest = quests[0]!;
  const introSeen = !!save.flags['mentor-intro'];
  const lines = introDialogue(name);

  const finishIntro = () => {
    let r = setFlag(save, 'mentor-intro');
    game.apply(r);
    game.apply(acceptQuest(getStore().save, quest.id));
  };

  return (
    <main class="scene theme-academy" data-testid="academy">
      <div class="scene-card">
        <h1 class="scene-title">🏰 Bytehaven Academy</h1>
        {!introSeen ? (
          <div class="dialogue" data-testid="dialogue">
            <Juno />
            <div class="dialogue-box">
              <div class="speaker">{lines[line]!.who === 'Juno' ? 'Mentor Juno' : name}</div>
              <p data-testid="dialogue-text">{lines[line]!.text}</p>
              <div class="dialogue-actions">
                {line < lines.length - 1 ? (
                  <button class="btn primary" onClick={() => setLine(line + 1)} data-testid="dialogue-next">Continue ({line + 1}/{lines.length})</button>
                ) : (
                  <button class="btn primary" onClick={finishIntro} data-testid="accept-quest">I’m ready to explore!</button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div class="dialogue">
              <Juno />
              <div class="dialogue-box">
                <div class="speaker">Mentor Juno</div>
                <p data-testid="mentor-advice">{mentorAdvice(save)}</p>
              </div>
            </div>
            <DailyCard onStart={onDaily} compact />
            <QuestOffers giver="Mentor Juno" exclude={[quest.id]} />
            <WorldChooser onEnter={(areaId) => onGo(areaId)} />
            <div>
              <section class="panel">
                <h2>📜 Quest board</h2>
                <div class="quest-line">
                  <strong>{quest.title}</strong>
                  <span class={`chip ${save.quests[quest.id]?.status ?? 'none'}`}>{save.quests[quest.id]?.status === 'complete' ? 'Complete' : save.quests[quest.id] ? 'In progress' : 'Available'}</span>
                </div>
                <p class="muted">{quest.summary}</p>
                <button class="btn" onClick={() => onGo('training-grounds')}>Go to the Programming Hall →</button>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
