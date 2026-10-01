import { useEffect, useRef, useState } from 'preact/hooks';
import type { Interactable } from '../logic/sceneTypes';
import { promptText } from '../logic/interact';
import type { Conversation } from '../logic/dialogue';
import { quests } from '../../content/world';
import { nextObjective, objectiveDone, questStatus } from '../../game/quests';
import { useGame } from '../../game/store';

export function Prompt({ it }: { it: Interactable | null }) {
  if (!it) return null;
  const text = promptText(it);
  const [key, ...rest] = [text.slice(0, 3), text.slice(4)];
  return <div class="play-prompt pill" role="status" data-testid="play-prompt" data-target={it.id}><kbd>{key?.replace(/[\[\]]/g, '')}</kbd><span>{rest.join(' ')}</span></div>;
}

/** The latest thing that happened in the world, as text: also read aloud by screen readers, so nothing depends on seeing the animation. */
export function Caption({ text }: { text: string }) {
  return (
    <div class="play-caption-wrap" aria-live="polite" aria-atomic="true">
      {text && <div class="play-caption pill" data-testid="play-caption">{text}</div>}
    </div>
  );
}

export function Where({ title, blurb }: { title: string; blurb: string }) {
  return <div class="play-where pill" data-testid="play-where"><span class="where-title">📍 {title}</span><span class="muted">{blurb}</span></div>;
}

export function Controls() {
  return (
    <div class="play-controls" aria-hidden="true">
      <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows move</span>
      <span><kbd>Shift</kbd> run</span><span><kbd>Space</kbd> jump</span><span><kbd>E</kbd> interact</span>
      <span>drag mouse / <kbd>Q</kbd><kbd>R</kbd> look</span><span><kbd>M</kbd> map</span><span><kbd>Esc</kbd> menu</span>
    </div>
  );
}

/** What to do next, from the quests the player has accepted. Says WHERE the story goes, never how to solve it. */
export function QuestTracker() {
  const { save } = useGame();
  const active = quests.filter((q) => { const s = questStatus(save, q); return s === 'accepted' || s === 'in-progress'; }).slice(0, 2);
  return (
    <aside class="play-tracker pill" aria-label="Quest tracker" data-testid="play-tracker">
      {active.length === 0 ? <span class="hint">No active quest. Talk to people: a glowing diamond marks someone with work for you.</span> : active.map((q) => {
        const next = nextObjective(save, q);
        return (
          <div key={q.id} data-testid={`tracker-${q.id}`}>
            <h3>{q.title}</h3>
            {q.objectives.map((o) => <div key={o.id} class={`step ${objectiveDone(save, o) ? 'done' : ''}`}>{objectiveDone(save, o) ? '☑' : o.id === next?.id ? '▶' : '☐'} {o.text}</div>)}
          </div>
        );
      })}
    </aside>
  );
}

interface DialogueProps {
  conv: Conversation | { npc: { name: string; role: string; icon?: string }; lines: string[]; canOffer: false; questId?: undefined };
  lines: string[];
  onClose: (accepted: boolean) => void;
}

/** Characters revealed per second by the typewriter (the whole line is always in the page for screen readers; reduced motion shows it at once). */
const CPS = 70;

/** A conversation, one line at a time, typed out. Space / Enter / E finish a line, then continue; Escape leaves; a quest offer ends with Accept and Not now. */
export function Dialogue({ conv, lines, onClose }: DialogueProps) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const last = i >= lines.length - 1;
  const offer = last && conv.canOffer;
  const line = lines[i] ?? '';
  const done = shown >= line.length;
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { btn.current?.focus(); }, [i]);
  useEffect(() => {
    if (reduced) { setShown(line.length); return; }
    setShown(0);
    const t0 = performance.now(); let raf = 0;
    const tick = () => { const n = Math.min(line.length, Math.floor(((performance.now() - t0) / 1000) * CPS)); setShown(n); if (n < line.length) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i, line, reduced]);
  const advance = () => { if (!done) setShown(line.length); else if (last) onClose(false); else setI((n) => n + 1); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(false); return; }
      if ((e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'e') && (e.target as HTMLElement)?.tagName !== 'BUTTON') { e.preventDefault(); if (!done) setShown(line.length); else if (!offer) { if (last) onClose(false); else setI((n) => n + 1); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [last, offer, onClose, done, line]);
  const n = conv.npc;
  return (
    <div class="play-dialogue" role="dialog" aria-label={`Conversation with ${n.name}`} data-testid="play-dialogue" onClick={(e) => { if ((e.target as HTMLElement).closest('button')) return; advance(); }}>
      <div class="dlg-plate"><span class="dlg-icon" aria-hidden="true">{n.icon ?? '🧑'}</span><span class="dlg-name">{n.name}</span><span class="dlg-role">{n.role}</span></div>
      <p data-testid="dialogue-line" aria-live="polite"><span>{line.slice(0, shown)}</span><span class="dlg-rest">{line.slice(shown)}</span></p>
      <div class="dlg-row">
        <span class="dlg-more" aria-hidden="true">{done && !last ? '▼' : ''}</span>
        {offer && done ? (
          <>
            <button class="btn" onClick={() => onClose(false)} data-testid="dialogue-decline">Not now</button>
            <button class="btn gold" ref={btn} onClick={() => onClose(true)} data-testid="dialogue-accept">Accept quest</button>
          </>
        ) : offer ? (
          <button class="btn primary" ref={btn} onClick={advance} data-testid="dialogue-next">Continue</button>
        ) : last ? (
          <button class="btn primary" ref={btn} onClick={() => onClose(false)} data-testid="dialogue-close">Goodbye</button>
        ) : (
          <button class="btn primary" ref={btn} onClick={advance} data-testid="dialogue-next">Continue ({i + 1}/{lines.length})</button>
        )}
      </div>
    </div>
  );
}
