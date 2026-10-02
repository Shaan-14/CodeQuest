import { useEffect, useState } from 'preact/hooks';
import { items, achievementDefs } from '../../content/world';
import { exportSave, importSave } from '../../core/save';
import { resetAll } from '../../game/actions';
import { backfillEvidence } from '../../game/backfill';
import { equipGear } from '../../game/play';
import { getStore, useGame } from '../../game/store';
import { QuestJournal } from './QuestJournal';
import { Modal } from './Modal';
import { SkillsView } from './SkillsView';
import type { PanelTab } from './Hud';

const TABS: [PanelTab, string][] = [['quests', '📜 Quests'], ['pack', '🎒 Pack'], ['skills', '🧠 Skills'], ['trophies', '🏆 Trophies'], ['menu', '⚙️ Menu']];

export function Panel({ tab, onTab, onClose, onReset }: { tab: PanelTab; onTab: (t: PanelTab) => void; onClose: () => void; onReset: () => void }) {
  // the key that opened a page closes it again (J for the journal, I for the pack), unless you are typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase(); if ((k === 'j' && tab === 'quests') || (k === 'i' && tab === 'pack')) onClose();
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [tab, onClose]);
  return (
    <Modal title="Adventurer’s Journal" onClose={onClose} wide>
      <div class="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} class={tab === id ? 'active' : ''} onClick={() => onTab(id)} data-testid={`panel-tab-${id}`}>{label}</button>
        ))}
      </div>
      {tab === 'quests' && <QuestJournal />}
      {tab === 'pack' && <Pack />}
      {tab === 'skills' && <SkillsView />}
      {tab === 'trophies' && <Trophies />}
      {tab === 'menu' && <MenuTab onReset={onReset} />}
    </Modal>
  );
}

const SLOTS: { slot: 'head' | 'back'; label: string }[] = [{ slot: 'head', label: 'Head' }, { slot: 'back', label: 'Back' }];

/**
 * THE PACK: what you can WEAR. Every item here is gear you own: wearing it changes your avatar in the 3D world at once (the same item data draws the
 * avatar and this list, so they cannot disagree). Gear is looks only: it never gives XP, Focus, hints or evidence. Keepsakes from quests are
 * awards, so they live under Trophies.
 */
function Pack() {
  const game = useGame();
  const { save } = game;
  const gear = items.filter((i) => i.kind === 'cosmetic' && i.slot && save.inventory[i.id]);
  const worn = (slot: 'head' | 'back') => items.find((i) => i.id === save.play.gear[slot]);
  const wear = (slot: 'head' | 'back', id: string | null) => game.apply(equipGear(save, slot, id));
  return (
    <div data-testid="pack">
      <p class="muted small">Wear what you own: it changes how you look in the world, nothing else. <span class="coins">🪙 {save.stats.coins}</span></p>
      <div class="pack-slots">
        {SLOTS.map(({ slot, label }) => {
          const w = worn(slot);
          return (
            <section class="pack-slot panel" key={slot} data-testid={`slot-${slot}`} data-worn={w?.id ?? ''}>
              <h4>{label}</h4>
              {w ? <><div class="item-icon">{w.icon}</div><strong>{w.name}</strong><button class="btn small" onClick={() => wear(slot, null)} data-testid={`takeoff-${slot}`}>Take off</button></> : <p class="muted small">Nothing worn.</p>}
              <div class="pack-options">
                {gear.filter((i) => i.slot === slot && i.id !== w?.id).map((i) => (
                  <button key={i.id} class="btn small" onClick={() => wear(slot, i.id)} data-testid={`wear-${i.id}`} title={i.description}>{i.icon} Wear {i.name}</button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {gear.length === 0 && <p class="muted" data-testid="pack-empty">You own nothing to wear yet. The Bolt &amp; Barrel kiosk in Bytehaven Plaza sells gear for coins.</p>}
    </div>
  );
}

function Trophies() {
  const { save } = useGame();
  const keepsakes = items.filter((i) => i.kind === 'quest' && save.inventory[i.id]);
  return (
    <div>
      <p class="muted small">Achievements are milestones for fun. They are not evidence of skill.</p>
      {keepsakes.length > 0 && <div class="shop-grid" data-testid="keepsakes">{keepsakes.map((i) => <div class="shop-item" key={i.id}><div class="item-icon">{i.icon}</div><strong>{i.name}</strong><span class="muted small">{i.description}</span></div>)}</div>}
      <div class="trophy-grid" data-testid="trophies">
        {achievementDefs.map((a) => {
          const got = !!save.achievements[a.id];
          return (
            <div class={`trophy ${got ? 'got' : ''}`} key={a.id}>
              <span class="trophy-icon">{got ? a.icon : '❔'}</span>
              <strong>{got ? a.title : 'Locked'}</strong>
              <span class="small muted">{a.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MenuTab({ onReset }: { onReset: () => void }) {
  const game = useGame();
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(false);
  return (
    <div class="menu-tab">
      <section class="panel">
        <h3>Back up your progress</h3>
        <p class="muted small">Progress lives in this browser. Copy this text somewhere safe to keep a backup, or paste a backup here to restore it.</p>
        <textarea rows={4} value={text} placeholder="Save data appears here, or paste a backup" onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} data-testid="save-text" />
        <div class="row">
          <button class="btn small" onClick={() => setText(exportSave(game.save))} data-testid="export">Export</button>
          <button class="btn small" data-testid="import" onClick={() => {
            const s = importSave(text);
            if (s) { game.apply({ save: backfillEvidence(s), events: [] }); setMsg('Progress restored.'); } else setMsg('That does not look like a CodeQuest save.');
          }}>Import</button>
        </div>
        {msg && <p class="small" role="status">{msg}</p>}
      </section>
      <section class="panel danger">
        <h3>Reset everything</h3>
        <p class="muted small">Deletes your character, XP, evidence and progress from this browser.</p>
        {!confirm ? (
          <button class="btn small danger" onClick={() => setConfirm(true)} data-testid="reset">Reset progress…</button>
        ) : (
          <div class="row">
            <button class="btn small danger" onClick={() => { getStore().apply(resetAll()); onReset(); }} data-testid="reset-confirm">Yes, delete everything</button>
            <button class="btn small" onClick={() => setConfirm(false)}>Cancel</button>
          </div>
        )}
      </section>
    </div>
  );
}
