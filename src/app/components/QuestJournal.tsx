import { useState } from 'preact/hooks';
import { getLesson, skills } from '../../content';
import { getScene } from '../../content/play/scenes';
import { getStation, stationOfLesson } from '../../content/play/stations';
import { trackOfSkillId } from '../../content/worlds';
import { acceptQuest } from '../../game/actions';
import { journalFor, type JournalMission, type JournalWorld } from '../../game/journal';
import { activeTrack } from '../../game/lessons';
import { objectiveDone } from '../../game/quests';
import { getStore, useGame } from '../../game/store';
import { summarizeSkill, type SkillStatus } from '../../learning/mastery';

const KEY = 'codequest.journal.open';
const readOpen = (): string[] | null => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return Array.isArray(v) ? v : null; } catch { return null; } };
const writeOpen = (v: string[]) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private window */ } };

const LEVEL: Record<SkillStatus, string> = { none: 'Not started', attempted: 'Attempted', guided: 'Guided only', developing: 'Developing', demonstrated: 'Demonstrated' };

/** Where in the 3D world a lesson is taught (its console and room), if it has one; otherwise just the world's name. */
function whereIs(lessonId: string, worldName: string): string {
  const st = stationOfLesson(lessonId);
  const scene = st ? getScene(st.scene) : undefined;
  return st && scene ? `${getStation(st.id)?.title ?? 'a terminal'} · ${scene.title}` : worldName;
}

function MissionCard({ m, world }: { m: JournalMission; world: JournalWorld }) {
  const { save } = useGame();
  const active = m.status === 'accepted' || m.status === 'in-progress';
  return (
    <article class={`jr-mission ${m.status}`} data-testid={`mission-${m.quest.id}`} data-status={m.status}>
      <header>
        <strong>{m.quest.title}</strong>
        <span class={`chip ${m.status}`}>{active ? 'Active' : m.status === 'available' ? 'Available' : m.status === 'completed' ? 'Completed' : 'Locked'}</span>
      </header>
      <p class="muted small">{m.quest.summary}</p>
      {m.status === 'unavailable' && <p class="small jr-reason" data-testid={`mission-reason-${m.quest.id}`}>🔒 {m.reason}</p>}
      {m.status === 'available' && <button class="btn small gold" onClick={() => getStore().apply(acceptQuest(getStore().save, m.quest.id))} data-testid={`accept-${m.quest.id}`}>Accept mission</button>}
      {(active || m.status === 'completed') && (
        <ul class="jr-steps">
          {m.quest.objectives.map((o) => <li key={o.id} class={objectiveDone(save, o) ? 'done' : ''}>{objectiveDone(save, o) ? '✔' : '○'} {o.text}</li>)}
        </ul>
      )}
      {active && <p class="small jr-progress">{m.done} of {m.total} steps{m.next ? <> · next: <em>{m.next}</em></> : null}</p>}
      {m.status === 'completed' && <p class="small muted">Reward earned: {m.quest.reward.xp} XP, {m.quest.reward.coins} coins (a milestone, not proof of skill). {world.world.name}</p>}
    </article>
  );
}

function WorldSection({ w, open, toggle }: { w: JournalWorld; open: boolean; toggle: () => void }) {
  const { save } = useGame();
  const pct = w.lessons.total ? Math.round((w.lessons.done / w.lessons.total) * 100) : 0;
  const c = w.skills.counts;
  const mine = skills.filter((s) => trackOfSkillId(s.id) === w.track);
  const nextWhere = w.next.lessonId && w.next.kind === 'lesson' ? whereIs(w.next.lessonId, w.world.name) : '';
  return (
    <section class={`jr-world ${open ? 'open' : ''} ${w.begun ? 'begun' : ''}`} data-testid={`journal-${w.track}`}>
      <button class="jr-head" onClick={toggle} aria-expanded={open} data-testid={`journal-toggle-${w.track}`}>
        <span class="jr-icon" aria-hidden="true">{w.world.icon}</span>
        <span class="jr-title"><strong>{w.world.name}</strong><small>{w.current ? `${w.current.status === 'available' ? 'Available' : 'Active'}: ${w.current.quest.title}` : w.completed.length ? 'All missions complete' : 'No mission yet'}</small></span>
        <span class="jr-meter" aria-label={`${w.lessons.done} of ${w.lessons.total} lessons completed`}><i style={{ width: `${pct}%` }} /><b>{w.lessons.done}/{w.lessons.total}</b></span>
        <span class="jr-mastery" title="Skills by what the evidence shows. Only independent, hint-free passes across different problems make a skill demonstrated.">{c.demonstrated} ◆ {c.developing} ◐ {c.guided + c.attempted} ○</span>
        <span class="jr-chevron" aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div class="jr-body">
          <div class="jr-next" data-testid={`journal-next-${w.track}`}>
            <span class="jr-kicker">{w.next.kind === 'training' ? 'Before anything else' : 'Next step'}</span>
            <p>{w.next.text}</p>
            {nextWhere && <p class="small muted">📍 {nextWhere}</p>}
            {w.next.kind === 'locked' && w.next.missing && w.next.missing.length > 0 && <p class="small muted">Needs: {w.next.missing.join(', ')}</p>}
            {w.next.lessonId && getLesson(w.next.lessonId) && <p class="small muted">{getLesson(w.next.lessonId)!.blurb}</p>}
          </div>
          {w.current && <><h4>{w.current.status === 'available' ? 'Mission waiting' : 'Current mission'}</h4><MissionCard m={w.current} world={w} /></>}
          {w.available.filter((m) => m !== w.current).length > 0 && <><h4>Available missions</h4>{w.available.filter((m) => m !== w.current).map((m) => <MissionCard key={m.quest.id} m={m} world={w} />)}</>}
          {w.locked.length > 0 && <><h4>Locked missions</h4>{w.locked.map((m) => <MissionCard key={m.quest.id} m={m} world={w} />)}</>}
          {w.completed.length > 0 && <><h4>Completed missions</h4>{w.completed.map((m) => <MissionCard key={m.quest.id} m={m} world={w} />)}</>}
          <h4>Skills you are building here</h4>
          <div class="jr-skills">
            {mine.map((s) => { const st = summarizeSkill(save.evidence, s).status; return <span key={s.id} class={`jr-skill ${st}`} title={LEVEL[st]}>{s.title}<small>{LEVEL[st]}</small></span>; })}
          </div>
          <p class="small muted">Missions are milestones for pacing. What you can actually do is recorded in Skills, from your work.</p>
        </div>
      )}
    </section>
  );
}

/**
 * The Quest Journal: every world in the curriculum, each a collapsible section with its current mission, next step, available / locked /
 * completed missions and the skills it builds. It is built entirely by game/journal.ts from the same data the game already keeps.
 */
export function QuestJournal() {
  const { save } = useGame();
  const worlds = journalFor(save);
  const [open, setOpen] = useState<string[]>(() => readOpen() ?? [activeTrack(save)]);
  const set = (v: string[]) => { setOpen(v); writeOpen(v); };
  const toggle = (t: string) => set(open.includes(t) ? open.filter((x) => x !== t) : [...open, t]);
  return (
    <div class="journal" data-testid="quest-log">
      <div class="jr-top">
        <h3>Quest Journal</h3>
        <span class="row"><button class="btn small" onClick={() => set(worlds.map((w) => w.track))} data-testid="journal-expand">Expand all</button><button class="btn small" onClick={() => set([])} data-testid="journal-collapse">Collapse all</button></span>
      </div>
      <p class="muted small">Every world has its own path. Open any to see what you are doing, what you have finished and what comes next.</p>
      {worlds.map((w) => <WorldSection key={w.track} w={w} open={open.includes(w.track)} toggle={() => toggle(w.track)} />)}
    </div>
  );
}
