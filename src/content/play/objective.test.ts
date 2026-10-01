import { describe, expect, it } from 'vitest';
import { newSave } from '../../core/save';
import * as A from '../../game/actions';
import { acceptQuest } from '../../game/actions';
import { recordSeen, recordTalk } from '../../game/play';
import { nextWaypoint, objectiveFor, route, type ObjectiveDeps } from '../../play/logic/objective';
import { buildGrid, findPath } from '../../play/logic/path';
import { collidersOf } from '../../play/logic/movement';
import { getNpc3D } from './cast';
import { scenes } from './scenes';
import { stationServes } from './stations';

const deps = (trainingOwed = false): ObjectiveDeps => ({ scenes, getNpc: getNpc3D, stationMatches: stationServes, trainingOwed });
const fresh = () => A.createPlayer(newSave(), 'Ada', 'spellwright').save;

describe('the objective: what to do next and where', () => {
  it('a new player is pointed at the nearest person with work, and the route goes through the right door', () => {
    const o = objectiveFor(fresh(), 'robotics-atrium', deps())!;
    expect(o.kind).toBe('offer'); expect(o.sceneId).toBe('maintenance-bay'); expect(o.label).toMatch(/Juno/);
    const w = nextWaypoint(o, 'robotics-atrium', scenes)!;
    expect(w.via).toBe(true); expect(w.toScene).toBe('maintenance-bay');
    expect(nextWaypoint(o, 'maintenance-bay', scenes)!.via).toBe(false);
  });
  it('after accepting, the objective is the next quest step: inspect, then the console', () => {
    let s = fresh();
    s = recordTalk(s, 'juno').save; s = acceptQuest(s, 'q-bay-briefing').save;
    let o = objectiveFor(s, 'maintenance-bay', deps())!;
    expect(o.kind).toBe('quest'); expect(o.questId).toBe('q-bay-briefing');
    s = recordSeen(s, 'bolt-table').save;
    o = objectiveFor(s, 'maintenance-bay', deps())!;
    expect(o.label).toMatch(/Repair Console/);
  });
  it('a required training plan outranks everything and points at the Simulation Room', () => {
    const o = objectiveFor(fresh(), 'plaza', deps(true))!;
    expect(o.kind).toBe('training'); expect(o.sceneId).toBe('sim-room');
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
