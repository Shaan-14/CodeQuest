import { describe, expect, it } from 'vitest';
import * as A from '../../game/actions';
import { recordSeen, recordTalk } from '../../game/play';
import { lessons, challenges } from '../../content';
import { cast, getNpc3D } from '../../content/play/cast';
import { getScene } from '../../content/play/scenes';
import { stationServes } from '../../content/play/stations';
import { getQuest, questStatus } from '../../game/quests';
import { newSave, type SaveData } from '../../core/save';
import { deriveWorldState } from '../../game/worldEvents';
import { conversationWith } from './dialogue';
import { hasEffect, holds } from './conditions';
import { markersFor } from './markers';
import { canUseExit } from './travel';

const fresh = (): SaveData => A.createPlayer(newSave(), 'Ada', 'spellwright').save;
/** Pass the final challenge of a lesson (what finishing it at a console does). */
const passLesson = (s: SaveData, lessonId: string): SaveData => {
  const l = lessons.find((x) => x.id === lessonId)!;
  let out = s;
  for (const st of l.steps) if (st.kind === 'challenge') out = A.submitChallenge(out, st.challengeId, true, 3000, 'pass').save;
  return A.completeLesson(out, lessonId).save;
};

describe('dialogue follows the story', () => {
  it('Juno offers the first quest to a new player, and stops offering it once accepted', () => {
    let s = fresh();
    const juno = getNpc3D('juno')!;
    const first = conversationWith(s, juno);
    expect(first.canOffer).toBe(true);
    expect(first.questId).toBe('q-bay-briefing');
    s = A.acceptQuest(s, 'q-bay-briefing').save;
    const again = conversationWith(s, juno);
    expect(again.canOffer).toBe(false);
    expect(again.entry.lines.join(' ')).toContain('look at Bolt');
  });
  it('after inspecting the robot she points at the console; after the display boots she says so', () => {
    let s = A.acceptQuest(fresh(), 'q-bay-briefing').save;
    s = recordSeen(s, 'bolt-table').save;
    expect(conversationWith(s, getNpc3D('juno')!).entry.lines.join(' ')).toContain('console');
  });
  it('a quest that is not yet available is never offered (Rowan waits for the briefing)', () => {
    const c = conversationWith(fresh(), getNpc3D('rowan')!);
    expect(c.canOffer).toBe(false);
  });
  it('every NPC always has something to say', () => { for (const n of cast) expect(conversationWith(fresh(), n).entry.lines.length, n.id).toBeGreaterThan(0); });
  it('conditions combine: any / not', () => {
    const s = fresh();
    expect(holds(s, { any: [{ met: 'nobody' }, { notMet: 'nobody' }] })).toBe(true);
    expect(holds(s, { not: { notMet: 'nobody' } })).toBe(false);
    expect(holds(recordTalk(s, 'pip').save, { met: 'pip' })).toBe(true);
  });
});

describe('the world is what the player’s code did (derived, never stored)', () => {
  it('passing the first lesson causes bay.bolt:eyes, completes the briefing quest once its other steps are done, and survives a JSON round-trip', () => {
    let s = A.acceptQuest(fresh(), 'q-bay-briefing').save;
    s = recordTalk(s, 'juno').save;
    s = recordSeen(s, 'bolt-table').save;
    expect(questStatus(s, getQuest('q-bay-briefing')!)).toBe('in-progress');
    s = passLesson(s, 'py-01-first-program');
    expect(hasEffect(s, 'bay.bolt:eyes')).toBe(true);
    expect(questStatus(s, getQuest('q-bay-briefing')!)).toBe('completed');
    expect(s.stats.xp).toBeGreaterThan(0);
    const reloaded = JSON.parse(JSON.stringify(s)) as SaveData;
    expect(deriveWorldState(reloaded)['bay.bolt']?.actions).toContain('eyes');
    // walking to Bolt and back changes nothing: there is no save field that can fake a repaired robot
    expect(Object.keys(reloaded.play)).toEqual(['scene', 'pos', 'talked', 'seen', 'settings']);
  });
  it('a failed attempt repairs nothing and is reported as a failure event', () => {
    let s = fresh();
    for (const id of ['py-01-first-program', 'py-02-fixing-errors', 'py-03-variables', 'py-04-strings']) s = passLesson(s, id);
    const c = challenges.find((x) => x.id === 'py-05-crates')!;
    const r = A.submitChallenge(s, c.id, false, 1000, 'x');
    expect(r.events.some((e) => e.type === 'challengeFailed')).toBe(true);
    expect(hasEffect(r.save, 'bay.bolt:servo')).toBe(false);
  });
  it('the effect is emitted live exactly once (first pass), then it is just the state of the world', () => {
    const l = lessons.find((x) => x.id === 'py-01-first-program')!;
    const finalId = [...l.steps].reverse().find((x) => x.kind === 'challenge')!;
    let s = fresh();
    const first = A.submitChallenge(s, (finalId as { challengeId: string }).challengeId, true, 1000, 'p');
    expect(first.events.filter((e) => e.type === 'worldEffect')).toHaveLength(1);
    s = first.save;
    const again = A.submitChallenge(s, (finalId as { challengeId: string }).challengeId, true, 1000, 'p');
    expect(again.events.filter((e) => e.type === 'worldEffect')).toHaveLength(0);
  });
});

describe('quest markers say where the story continues', () => {
  const scene = getScene('maintenance-bay')!;
  const cast3 = (id: string) => getNpc3D(id);
  const interactables = scene.interactables;
  it('a new player sees Juno marked with an offer', () => {
    const m = markersFor(fresh(), scene, interactables, cast3, stationServes);
    expect(m.find((x) => x.id === 'talk-juno')?.kind).toBe('offer');
  });
  it('after accepting: Bolt is the next step; after inspecting: the console', () => {
    let s = recordTalk(A.acceptQuest(fresh(), 'q-bay-briefing').save, 'juno').save;
    expect(markersFor(s, scene, interactables, cast3, stationServes).map((x) => x.id)).toContain('bolt-table');
    s = recordSeen(s, 'bolt-table').save;
    const ids = markersFor(s, scene, interactables, cast3, stationServes).map((x) => x.id);
    expect(ids).toContain('bolt-console');
    expect(ids).not.toContain('bolt-table');
  });
});

describe('doors and gates use the skill graph', () => {
  it('the Summit trail is closed until ten lessons are done, and says so; open afterwards', () => {
    const closed = canUseExit(fresh(), { area: 'summit', label: 'Summit' });
    expect(closed.ok).toBe(false);
    let s = fresh();
    for (const l of lessons.filter((x) => x.id.startsWith('py-')).slice(0, 10)) s = A.completeLesson(s, l.id).save;
    expect(Object.values(s.learning.lessons).filter((l) => l.completed).length).toBeGreaterThanOrEqual(10);
    expect(canUseExit(s, { area: 'summit', label: 'Summit' }).ok).toBe(true); // the rule is the area's (the skill graph), not a scene's
  });
  it('a door with skill requirements names exactly what is missing', () => {
    const r = canUseExit(fresh(), { requires: [{ skill: 'py.functions' }], label: 'The Floor' });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Prerequisite required/);
    expect(r.reqs).toHaveLength(1);
  });
  it('a door with no gate is always open', () => { expect(canUseExit(fresh(), { label: 'x' }).ok).toBe(true); });
});
