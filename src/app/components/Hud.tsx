import { items } from '../../content/world';
import { MAX_FOCUS } from '../../core/save';
import { levelProgress } from '../../game/progression';
import { useGame } from '../../game/store';
import { Avatar } from './Avatar';

export type PanelTab = 'pack' | 'quests' | 'trophies' | 'skills' | 'menu';

interface Props {
  onMap: () => void;
  onPanel: (tab: PanelTab) => void;
  onDaily: () => void;
}

export function Hud({ onMap, onPanel, onDaily }: Props) {
  const { save } = useGame();
  if (!save.player) return null;
  const lp = levelProgress(save.stats.xp);
  const pack = Object.values(save.inventory).reduce((a, b) => a + b, 0);
  const cosmetic = (id: string) => items.some((i) => i.id === id && i.kind === 'cosmetic') && !!save.inventory[id];
  return (
    <header class="hud" data-testid="hud">
      <div class="hud-id">
        <Avatar avatar={save.player.avatar} size={44} cape={cosmetic('explorer-cape')} cap={cosmetic('lucky-cap')} />
        <div>
          <div class="hud-name" data-testid="player-name">{save.player.name}</div>
          <div class="hud-level" data-testid="level">Level {lp.level}</div>
        </div>
      </div>
      <div class="hud-bars">
        <div class="bar xp" title={`${lp.into} / ${lp.span} XP to next level`}>
          <div class="bar-fill" style={{ width: `${(lp.into / lp.span) * 100}%` }} />
          <span data-testid="xp">{save.stats.xp} XP</span>
        </div>
        <div class={`bar focus ${save.stats.focus === 0 ? 'empty' : ''} ${save.stats.focus < MAX_FOCUS ? 'not-ready' : ''}`} title={save.stats.focus < MAX_FOCUS ? 'Not ready: you need 100 Focus to attempt a challenge. Earn it back in the Training Grounds.' : 'Focus 100: ready to attempt challenges. A wrong answer costs Focus; training earns it back.'}>
          <div class="bar-fill" style={{ width: `${(save.stats.focus / MAX_FOCUS) * 100}%` }} />
          <span data-testid="focus">Focus {save.stats.focus}/{MAX_FOCUS}{save.stats.focus < MAX_FOCUS ? ' · not ready' : ''}</span>
        </div>
      </div>
      <div class="hud-coins" data-testid="coins" title="Coins">🪙 {save.stats.coins}</div>
      <nav class="hud-nav" aria-label="Game menu">
        <button onClick={onMap} title="World map">🗺️<span>Map</span></button>
        <button onClick={onDaily} title="Daily Challenge" data-testid="hud-daily">🌅<span>Daily{save.daily.current?.status === 'open' ? ' •' : ''}</span></button>
        <button onClick={() => onPanel('quests')} title="Quest log">📜<span>Quests</span></button>
        <button onClick={() => onPanel('pack')} title="Inventory">🎒<span>Pack{pack ? ` (${pack})` : ''}</span></button>
        <button onClick={() => onPanel('skills')} title="Skills and evidence">🧠<span>Skills</span></button>
        <button onClick={() => onPanel('trophies')} title="Achievements">🏆<span>Trophies</span></button>
        <button onClick={() => onPanel('menu')} title="Menu">⚙️<span>Menu</span></button>
      </nav>
    </header>
  );
}
