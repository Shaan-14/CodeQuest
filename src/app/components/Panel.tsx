import { useState } from 'preact/hooks';
import { items, quests, achievementDefs } from '../../content/world';
import { getLesson } from '../../content';
import { exportSave, importSave } from '../../core/save';
import { resetAll } from '../../game/actions';
import { backfillEvidence } from '../../game/backfill';
import { getStore, useGame } from '../../game/store';
import { Modal } from './Modal';
import { SkillsView } from './SkillsView';
import type { PanelTab } from './Hud';

const TABS: [PanelTab, string][] = [['quests', '📜 Quests'], ['pack', '🎒 Pack'], ['skills', '🧠 Skills'], ['trophies', '🏆 Trophies'], ['menu', '⚙️ Menu']];

export function Panel({ tab, onTab, onClose, onReset }: { tab: PanelTab; onTab: (t: PanelTab) => void; onClose: () => void; onReset: () => void }) {
  return (
    <Modal title="Adventurer’s Journal" onClose={onClose} wide>
      <div class="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} class={tab === id ? 'active' : ''} onClick={() => onTab(id)} data-testid={`panel-tab-${id}`}>{label}</button>
        ))}
      </div>
      {tab === 'quests' && <QuestLog />}
      {tab === 'pack' && <Pack />}
      {tab === 'skills' && <SkillsView />}
      {tab === 'trophies' && <Trophies />}
      {tab === 'menu' && <MenuTab onReset={onReset} />}
    </Modal>
  );
}

function QuestLog() {
  const { save } = useGame();
  const active = quests.filter((q) => save.quests[q.id]);
  if (!active.length) return <p class="muted">No quests yet. Speak to Mentor Juno at the Academy.</p>;
  return (
    <div data-testid="quest-log">
      {active.map((q) => (
        <section class="panel" key={q.id}>
          <div class="quest-line"><strong>{q.title}</strong><span class={`chip ${save.quests[q.id]!.status}`}>{save.quests[q.id]!.status === 'complete' ? 'Complete' : 'Active'}</span></div>
          <p class="muted">{q.summary}</p>
          <ul class="objectives">
            {q.objectives.map((o) => {
              const done = !!save.learning.lessons[o.lessonId]?.completed;
              return <li key={o.id} class={done ? 'done' : ''}>{done ? '☑' : '☐'} {o.text} <span class="muted small">({getLesson(o.lessonId)?.title})</span></li>;
            })}
          </ul>
          <p class="small muted">Reward: {q.reward.xp} XP, {q.reward.coins} coins{q.reward.items?.length ? ', and a keepsake' : ''}. Completing a quest is a milestone, not proof of mastery.</p>
        </section>
      ))}
    </div>
  );
}

function Pack() {
  const game = useGame();
  const { save } = game;
  const owned = items.filter((i) => save.inventory[i.id]);
  if (!owned.length) return <p class="muted" data-testid="pack-empty">Your pack is empty. Earn coins and visit the shop.</p>;
  return (
    <div class="shop-grid" data-testid="pack">
      {owned.map((i) => (
        <div class="shop-item" key={i.id}>
          <div class="item-icon">{i.icon}</div>
          <strong>{i.name} ×{save.inventory[i.id]}</strong>
          <span class="muted small">{i.description}</span>
        </div>
      ))}
    </div>
  );
}

function Trophies() {
  const { save } = useGame();
  return (
    <div>
      <p class="muted small">Achievements are milestones for fun. They are not evidence of skill.</p>
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
