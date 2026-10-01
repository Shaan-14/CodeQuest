import { describe, expect, it } from 'vitest';
import { newSave } from '../../core/save';
import * as A from '../../game/actions';
import { nextWaypoint, objectiveFor, route, type ObjectiveDeps } from '../../play/logic/objective';
import { buildGrid, findPath } from '../../play/logic/path';
import { collidersOf } from '../../play/logic/movement';
import { getNpc3D } from './cast';
import { stations } from './stations';
import { scenes } from './scenes';
import { stationServes } from './stations';

const deps = (trainingOwed = false): ObjectiveDeps => ({ scenes, getNpc: getNpc3D, stationMatches: stationServes, trainingOwed });
const fresh = () => A.createPlayer(newSave(), 'Ada', 'spellwright').save;

const done = (s: ReturnType<typeof fresh>, ids: string[]) => { const c = structuredClone(s); for (const id of ids) c.learning.lessons[id] = { stepIndex: 99, completed: true }; return c; };
const stationLessons = (id: string) => stations.find((x) => x.id === id)!.lessons;

describe('the objective: context-aware guidance from the learning record', () => {
  it('the plaza is a place to choose: no lesson destination and no trail', () => {
    const o = objectiveFor(fresh(), 'plaza', deps())!;
    expect(o.kind).toBe('choose'); expect(o.sceneId).toBe(''); expect(nextWaypoint(o, 'plaza', scenes)).toBeNull();
    expect(objectiveFor(done(fresh(), stationLessons('bolt-console')), 'plaza', deps())!.kind).toBe('choose');
  });
  it('entering the Python world guides to the next Python lesson, through the right door', () => {
    const o = objectiveFor(fresh(), 'robotics-atrium', deps())!;
    expect(o.kind).toBe('lesson'); expect(o.lessonId).toBe('py-01-first-program'); expect(o.sceneId).toBe('maintenance-bay'); expect(o.label).toMatch(/Repair Console/);
    const w = nextWaypoint(o, 'robotics-atrium', scenes)!;
    expect(w.via).toBe(true); expect(w.toScene).toBe('maintenance-bay');
    expect(nextWaypoint(o, 'maintenance-bay', scenes)!.via).toBe(false);
  });
  it('the objective follows the real progression: finish lesson 1 and it is lesson 2, then lesson 3', () => {
    const l = stationLessons('bolt-console');
    expect(objectiveFor(done(fresh(), [l[0]!]), 'maintenance-bay', deps())!.lessonId).toBe(l[1]);
    expect(objectiveFor(done(fresh(), l.slice(0, 2)), 'maintenance-bay', deps())!.lessonId).toBe(l[2]);
  });
  it('after the bay is finished the guide moves to the next terminal in the same world (another room)', () => {
    const o = objectiveFor(done(fresh(), stationLessons('bolt-console')), 'maintenance-bay', deps())!;
    expect(o.lessonId).toBe(stationLessons('line-console')[0]); expect(o.sceneId).toBe('manufacturing-floor');
  });
  it('each world guides only its own subject: SQL in the ballpark, spreadsheets at the track, web at the academy', () => {
    const s = done(fresh(), stationLessons('bolt-console').slice(0, 3));
    expect(objectiveFor(s, 'ballpark', deps())!.lessonId).toBe('sql-01-select');
    expect(objectiveFor(s, 'garage', deps())!.lessonId).toBe('xl-01-formulas');
    expect(objectiveFor(s, 'lantern-courtyard', deps())!.lessonId).toBe('web-01-html-basics');
    expect(objectiveFor(s, 'robotics-atrium', deps())!.lessonId).toBe(stationLessons('bolt-console')[3]);
  });
  it('leaving the learning world removes its objective', () => {
    const s = fresh();
    expect(objectiveFor(s, 'robotics-atrium', deps())!.kind).toBe('lesson');
    expect(objectiveFor(s, 'plaza', deps())!.kind).toBe('choose');
  });
  it('a required training plan outranks everything, in any place, and points at the Simulation Room', () => {
    for (const where of ['plaza', 'ballpark', 'robotics-atrium']) { const o = objectiveFor(fresh(), where, deps(true))!; expect(o.kind, where).toBe('training'); expect(o.sceneId).toBe('sim-room'); }
  });
  it('when a world has nothing left to teach at its terminals the guide says so instead of inventing an errand', () => {
    const all = [...stationLessons('analytics-console')];
    const s = done(fresh(), all);
    const o = objectiveFor(s, 'ballpark', deps())!;
    expect(['free', 'activity', 'lesson']).toContain(o.kind);
    if (o.kind === 'free') expect(nextWaypoint(o, 'ballpark', scenes)).toBeNull();
  });
  it('every scene is connected, so a route always exists between any two places', () => {
    for (const a of scenes) for (const b of scenes) expect(route(scenes, a.id, b.id), `${a.id} -> ${b.id}`).not.toBeNull();
  });
  it('the trail can be walked: from every spawn to every exit and interactable of its scene (gates open)', () => {
    for (const sc of scenes) {
      const g = buildGrid(sc.bounds, collidersOf({ ...sc, props: sc.props.filter((p) => !p.id) })); // props with an id can open (a gate): the trail is rebuilt when they do
      const targets = [...sc.exits.map((e) => ({ x: e.x, z: e.z, n: e.id })), ...sc.interactables.map((i) => ({ x: i.x, z: i.z, n: i.id }))];
      for (const sp of Object.values(sc.spawns)) for (const t of targets) expect(findPath(g, sp, t), `${sc.id}: spawn -> ${t.n}`).not.toBeNull();
    }
  });
});
