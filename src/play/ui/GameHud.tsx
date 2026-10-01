import { MAX_FOCUS } from '../../core/save';
import { levelProgress } from '../../game/progression';
import { useGame } from '../../game/store';
import { Avatar } from '../../app/components/Avatar';
import type { PanelTab } from '../../app/components/Hud';

/**
 * The in-world HUD: player card (portrait, level, XP, Focus) and a row of game menus. It reads the same save the classic HUD does; XP and level
 * are shown as pacing only, and Focus says plainly when the player is not ready (the Focus gate is enforced in the game layer, not here).
 */
export function GameHud({ onPanel, onMap, onManual, onMenu }: { onPanel: (t: PanelTab) => void; onMap: () => void; onManual: () => void; onMenu: () => void }) {
  const { save } = useGame();
  if (!save.player) return null;
  const lp = levelProgress(save.stats.xp);
  const notReady = save.stats.focus < MAX_FOCUS;
  const btn = (icon: string, label: string, onClick: () => void, key?: string, testid?: string) => (
    <button class="ghud-btn" onClick={onClick} title={key ? `${label} (${key})` : label} aria-label={label} data-testid={testid}><span aria-hidden="true">{icon}</span><small>{label}</small></button>
  );
  return (
    <>
      <div class="ghud-card" data-testid="hud">
        <div class="ghud-portrait"><Avatar avatar={save.player.avatar} size={52} /></div>
        <div class="ghud-info">
          <div class="ghud-name"><span data-testid="player-name">{save.player.name}</span><span class="ghud-level" data-testid="level">Lv {lp.level}</span></div>
          <div class="ghud-bar xp" title={`${lp.into} / ${lp.span} XP to the next level. XP is pacing, not skill.`}><i style={{ width: `${(lp.into / lp.span) * 100}%` }} /><span data-testid="xp">{save.stats.xp} XP</span></div>
          <div class={`ghud-bar focus ${notReady ? 'notready' : ''}`} title={notReady ? 'Not ready: 100 Focus is required to attempt a challenge. Train in the Simulation Room to earn it back.' : 'Focus 100: ready to attempt challenges.'}>
            <i style={{ width: `${(save.stats.focus / MAX_FOCUS) * 100}%` }} /><span data-testid="focus">Focus {save.stats.focus}/{MAX_FOCUS}{notReady ? ' · not ready' : ''}</span>
          </div>
        </div>
      </div>
      <nav class="ghud-menu" aria-label="Game menu">
        <span class="ghud-coins" data-testid="coins" title="Coins">🪙 {save.stats.coins}</span>
        {btn('📜', 'Quests', () => onPanel('quests'), 'J')}
        {btn('🧠', 'Skills', () => onPanel('skills'))}
        {btn('🎒', 'Pack', () => onPanel('pack'))}
        {btn('🏆', 'Trophies', () => onPanel('trophies'))}
        {btn('🗺️', 'Map', onMap, 'M')}
        {btn('📖', 'Manual', onManual, 'H', 'play-manual-btn')}
        {btn('☰', 'Menu', onMenu, 'Esc', 'play-menu')}
      </nav>
    </>
  );
}
