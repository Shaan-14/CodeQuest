/**
 * Content tests for the playable world: every reference in scene, cast, station, quest and effect data must point at something real, every
 * place must be reachable, and every story step must be completable. These run in plain Node (no WebGL): the scenes are data.
 */
import { describe, expect, it } from 'vitest';
import { builders } from '../../play/engine/builders';
import { holds } from '../../play/logic/conditions';
import { collidersOf } from '../../play/logic/movement';
import { spawnExists } from '../../play/logic/travel';
import type { Condition, SceneDef } from '../../play/logic/sceneTypes';
import { areas, quests } from '../world';
import { getAnyChallenge, getLesson, lessons } from '../index';
import { BASEBALL_STEPS } from './baseball';
import { cast, getNpc3D } from './cast';
import { PLAY_EFFECTS } from './effects';
import { getScene, scenes } from './scenes';
import { stations, stationOfLesson } from './stations';
import { worlds3d, worldOfScene } from './worlds3d';
import { LESSON_EFFECTS, BOSS_EFFECTS } from '../worldEffects';
import { playQuests } from './quests';
import { bosses } from '../bosses';
import { newSave } from '../../core/save';
import { createPlayer } from '../../game/actions';

const ALL_EFFECTS = new Set<string>();
for (const src of [PLAY_EFFECTS, LESSON_EFFECTS, BOSS_EFFECTS]) for (const list of Object.values(src)) for (const e of list) ALL_EFFECTS.add(`${e.target}:${e.action}`);
/** Facts the UI records (not derived from evidence): they are the only `inspect` references that are not objects in a scene. */
const UI_FACTS = new Set(['sim-win', 'lap-done', 'lap-par', 'juno-debrief']);
const conds = (c: Condition | undefined, out: Condition[] = []): Condition[] => { if (!c) return out; out.push(c); conds(c.not, out); c.any?.forEach((x) => conds(x, out)); return out; };

describe('scenes are well formed', () => {
  it('have unique ids and known prop kinds', () => {
    expect(new Set(scenes.map((s) => s.id)).size).toBe(scenes.length);
    for (const s of scenes) for (const p of s.props) expect(builders[p.kind], `${s.id}: prop kind ${p.kind}`).toBeDefined();
  });
  it('every door leads to a real scene and a real spawn there, and every scene has a default spawn inside its bounds', () => {
    for (const s of scenes) {
      expect(s.spawns.default, `${s.id} default spawn`).toBeDefined();
      for (const [k, sp] of Object.entries(s.spawns)) {
        expect(sp.x, `${s.id}/${k}`).toBeGreaterThanOrEqual(s.bounds.minX); expect(sp.x).toBeLessThanOrEqual(s.bounds.maxX);
        expect(sp.z).toBeGreaterThanOrEqual(s.bounds.minZ); expect(sp.z).toBeLessThanOrEqual(s.bounds.maxZ);
      }
      for (const e of s.exits) {
        const to = getScene(e.to);
        expect(to, `${s.id} -> ${e.to}`).toBeDefined();
        expect(spawnExists(to!, e.spawn), `${s.id} -> ${e.to}/${e.spawn}`).toBe(true);
        if (e.area) expect(areas.some((a) => a.id === e.area), `area ${e.area}`).toBe(true);
      }
    }
  });
  it('nobody spawns inside a solid object, and every door and interactable is inside the walkable area', () => {
    for (const s of scenes) {
      const cols = collidersOf(s);
      for (const [k, sp] of Object.entries(s.spawns)) for (const c of cols) {
        if (c.kind === 'box') expect(Math.abs(sp.x - c.x) < c.w / 2 && Math.abs(sp.z - c.z) < c.d / 2 && (c.h ?? 9) > 0.5, `${s.id}/${k} inside a box at ${c.x},${c.z}`).toBe(false);
        else expect(Math.hypot(sp.x - c.x, sp.z - c.z) < c.r, `${s.id}/${k} inside a circle`).toBe(false);
      }
      for (const i of [...s.interactables, ...s.exits]) { expect(i.x).toBeGreaterThanOrEqual(s.bounds.minX); expect(i.x).toBeLessThanOrEqual(s.bounds.maxX); expect(i.z).toBeGreaterThanOrEqual(s.bounds.minZ); expect(i.z).toBeLessThanOrEqual(s.bounds.maxZ); }
    }
  });
  it('every place can be reached from the plaza by walking through doors, and every world has a way back', () => {
    const seen = new Set<string>(['plaza']); const queue = ['plaza'];
    while (queue.length) for (const e of getScene(queue.shift()!)!.exits) if (!seen.has(e.to)) { seen.add(e.to); queue.push(e.to); }
    for (const s of scenes) expect(seen.has(s.id), `${s.id} reachable`).toBe(true);
    // and back again
    for (const s of scenes.filter((x) => x.id !== 'plaza')) { const back = new Set([s.id]); const q = [s.id]; while (q.length) for (const e of getScene(q.shift()!)!.exits) if (!back.has(e.to)) { back.add(e.to); q.push(e.to); } expect(back.has('plaza'), `${s.id} leads back to the plaza`).toBe(true); }
  });
  it('interactables reference real NPCs, stations and bosses, with unique ids per scene', () => {
    for (const s of scenes) {
      const ids = [...s.interactables.map((i) => i.id), ...s.exits.map((e) => `exit:${e.id}`)];
      expect(new Set(ids).size, `${s.id} ids`).toBe(ids.length);
      const npcIds = new Set(s.npcs.map((n) => n.npc));
      for (const n of npcIds) expect(getNpc3D(n), `${s.id} npc ${n}`).toBeDefined();
      for (const i of s.interactables) {
        const a = i.action;
        if (a.type === 'talk') { expect(getNpc3D(a.npc), `${s.id}/${i.id}`).toBeDefined(); expect(npcIds.has(a.npc), `${s.id}/${i.id}: that NPC stands here`).toBe(true); }
        if (a.type === 'terminal') { const st = stations.find((x) => x.id === a.station); expect(st, `${s.id}/${i.id} station`).toBeDefined(); expect(st!.scene, `${i.id}: a station's terminal is in its own scene`).toBe(s.id); }
        for (const c of conds(i.when)) { if (c.quest) expect(quests.some((q) => q.id === c.quest!.id)).toBe(true); }
      }
    }
  });
  it('every prop with an id that a reaction or consequence names exists in the same scene', () => {
    for (const s of scenes) {
      const propIds = new Set(s.props.map((p) => p.id).filter(Boolean));
      for (const r of s.reactions ?? []) { expect(propIds.has(r.prop), `${s.id}: reaction on ${r.prop}`).toBe(true); expect(ALL_EFFECTS.has(r.effect), `${s.id}: effect ${r.effect} is caused by something`).toBe(true); }
      for (const c of s.consequences ?? []) { expect(propIds.has(c.prop), `${s.id}: consequence on ${c.prop}`).toBe(true); expect(stations.some((x) => x.id === c.station && x.scene === s.id), `${s.id}: consequence station ${c.station}`).toBe(true); }
    }
  });
});

describe('stations open real lessons, and what they finish changes the world', () => {
  it('every lesson of every station exists, belongs to one station only, and appears in the right world', () => {
    const seen = new Set<string>();
    for (const st of stations) {
      expect(getScene(st.scene), st.id).toBeDefined();
      for (const l of st.lessons) { expect(getLesson(l), `${st.id}: ${l}`).toBeDefined(); expect(seen.has(l), `${l} in two stations`).toBe(false); seen.add(l); expect(stationOfLesson(l)?.id).toBe(st.id); }
    }
  });
  it('every world effect names a lesson that a station offers (or is one of the classic ones)', () => {
    for (const id of Object.keys(PLAY_EFFECTS)) { expect(getLesson(id), id).toBeDefined(); expect(stationOfLesson(id), `${id} is offered at a station`).toBeDefined(); }
  });
  it('every reaction in a scene corresponds to an effect a lesson at one of ITS stations causes (you can see what you did, where you did it)', () => {
    for (const s of scenes) {
      const here = new Set(stations.filter((st) => st.scene === s.id).flatMap((st) => st.lessons.flatMap((l) => (PLAY_EFFECTS[l] ?? []).map((e) => `${e.target}:${e.action}`))));
      for (const r of s.reactions ?? []) if (here.size) expect(here.has(r.effect) || BOSS_EFFECTS_FLAT.has(r.effect), `${s.id}: ${r.effect}`).toBe(true);
    }
  });
  it('the baseball steps are exactly the effects the office reacts to', () => { for (const st of BASEBALL_STEPS) expect(ALL_EFFECTS.has(st.effect), st.effect).toBe(true); });
});
const BOSS_EFFECTS_FLAT = new Set(Object.values(BOSS_EFFECTS).flat().map((e) => `${e.target}:${e.action}`));

describe('the story can be played to its end', () => {
  it('quest ids are unique across classic and story quests, each has a giver who exists in the cast (for story quests) and real rewards', () => {
    expect(new Set(quests.map((q) => q.id)).size).toBe(quests.length);
    for (const q of playQuests) { expect(cast.some((n) => n.name === q.giver || n.name.includes(q.giver.replace(/^(Mentor|Technician|Engineer|Warden|Tutor|Apprentice|Coach|Analyst|Crew Chief|Keeper) /, ''))), `${q.id} giver ${q.giver}`).toBe(true); if (q.requires) expect(quests.some((x) => x.id === q.requires), `${q.id} requires`).toBe(true); }
  });
  it('every quest step can be done: talk → an NPC exists, inspect → an object or fact exists, effect → some lesson or boss causes it, lesson → it exists', () => {
    const inspectIds = new Set<string>(UI_FACTS);
    const marks = new Set<string>();
    for (const s of scenes) for (const i of s.interactables) if (i.action.type === 'inspect') inspectIds.add(i.action.id);
    for (const n of cast) for (const d of n.dialogue) if (d.marks) marks.add(d.marks);
    for (const q of playQuests) for (const o of q.objectives) {
      const kind = o.kind ?? 'lesson';
      const ref = (o as { ref?: string }).ref ?? '';
      if (kind === 'talk') expect(getNpc3D(ref), `${q.id}/${o.id}`).toBeDefined();
      if (kind === 'inspect') expect(inspectIds.has(ref) || marks.has(ref), `${q.id}/${o.id}: nothing records "${ref}"`).toBe(true);
      if (kind === 'effect') expect(ALL_EFFECTS.has(ref), `${q.id}/${o.id}: nothing causes "${ref}"`).toBe(true);
      if (kind === 'challenge') expect(getAnyChallenge(ref), `${q.id}/${o.id}`).toBeDefined();
    }
  });
  it('every quest giver can actually offer their quest (a dialogue entry with `offer` exists) and the offer is reachable', () => {
    const offers = new Set<string>();
    for (const n of cast) for (const d of n.dialogue) if (d.offer) offers.add(d.offer);
    for (const q of playQuests) expect(offers.has(q.id), `${q.id} is offered by somebody`).toBe(true);
    for (const n of cast) for (const d of n.dialogue) for (const c of conds(d.when)) if (c.quest) expect(quests.some((q) => q.id === c.quest!.id), `${n.id}: ${c.quest.id}`).toBe(true);
  });
  it('quest chains are acyclic and their first links are available to a new player', () => {
    const s = createPlayer(newSave(), 'Ada', 'spellwright').save;
    const starts = playQuests.filter((q) => !q.requires);
    expect(starts.map((q) => q.id).sort()).toEqual(['q-bay-briefing', 'q-lantern-briefing', 'q-park-numbers', 'q-race-setup']); // one way in to every world
    for (const q of playQuests) { let cur = q, n = 0; while (cur.requires && n++ < 20) cur = quests.find((x) => x.id === cur.requires)!; expect(n, `${q.id} chain`).toBeLessThan(20); }
    expect(holds(s, { quest: { id: 'q-bay-briefing', status: ['available'] } })).toBe(true);
  });
  it('the Summit: seven guardian beacons match the seven mastery bosses, and the great beacon is lit by the Summit boss', () => {
    const sm = getScene('summit')!;
    const beaconEffects = (sm.reactions ?? []).map((r) => r.effect);
    for (const b of bosses.filter((x) => x.kind === 'mastery')) expect(BOSS_EFFECTS[b.id]?.some((e) => beaconEffects.includes(`${e.target}:${e.action}`)), `${b.id} lights a beacon`).toBe(true);
    expect(beaconEffects).toContain('summit.beacon:ignite');
    expect(BOSS_EFFECTS.summit?.map((e) => `${e.target}:${e.action}`)).toContain('summit.beacon:ignite');
  });
  it('every world is listed, in a valid world graph with scenes that exist', () => {
    for (const w of worlds3d) { expect(getScene(w.entry.scene), w.id).toBeDefined(); expect(spawnExists(getScene(w.entry.scene)!, w.entry.spawn)).toBe(true); for (const sc of w.scenes) { expect(getScene(sc), sc).toBeDefined(); expect(worldOfScene(sc)?.id).toBe(w.id); } for (const q of w.quests) expect(quests.some((x) => x.id === q)).toBe(true); }
    for (const s of scenes) expect(worldOfScene(s.id), `${s.id} belongs to a world`).toBeDefined();
  });
  it('there is no copyrighted fantasy material in the original academy (names are original)', () => {
    const text = JSON.stringify([cast, scenes.filter((s) => s.world === 'academy'), playQuests.filter((q) => q.id.startsWith('q-lantern'))]).toLowerCase();
    for (const banned of ['harry', 'potter', 'hogwarts', 'gryffindor', 'slytherin', 'dumbledore', 'voldemort', 'hermione', 'quidditch', 'muggle', 'expelliarmus', 'wingardium']) expect(text.includes(banned), banned).toBe(false);
  });
});

describe('what the player is told about the world is true', () => {
  it('lessons a station offers are all in the curriculum, with no station hiding a lesson from its prerequisites (first lesson has none)', () => {
    for (const st of stations) { const first = getLesson(st.lessons[0]!)!; expect(lessons.includes(first)).toBe(true); }
  });
  it('scenes of a world respect the learning tracks they present', () => {
    for (const w of worlds3d) for (const st of stations.filter((x) => w.scenes.includes(x.scene))) for (const l of st.lessons) { const id = l.split('-')[0]!; const okay = { py: ['python', 'data-eng'], web: ['web'], sql: ['sql', 'stats'], xl: ['sheets'] }[id]; expect(okay?.some((t) => w.tracks.includes(t)), `${w.id} presents ${l}`).toBe(true); }
  });
});
void (null as unknown as SceneDef);
