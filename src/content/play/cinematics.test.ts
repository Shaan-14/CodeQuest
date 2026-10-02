import { describe, expect, it } from 'vitest';
import { quests } from '../world';
import { referencedIds, sortedCues } from '../../play/logic/cinematic';
import { cinematicFor, CINEMATICS } from './cinematics';
import { cutawayFor, CUTAWAYS } from './cutaways';
import { getNpc3D } from './cast';
import { scenes } from './scenes';

describe('the cinematics of the world', () => {
  it('every reaction that names a cinematic names one that exists', () => {
    for (const sc of scenes) {
      for (const r of sc.reactions ?? []) if (r.cinematic) expect(CINEMATICS[r.cinematic], `${sc.id}: ${r.effect}`).toBeDefined();
    }
  });
  it('a cinematic only refers to props and people that exist in the scene that plays it', () => {
    for (const sc of scenes) {
      const used = new Set<string>([...(sc.reactions ?? []).flatMap((r) => (r.cinematic ? [r.cinematic] : []))]);
      for (const id of used) {
        const refs = referencedIds(CINEMATICS[id]!);
        for (const prop of refs.props) expect(sc.props.some((p) => p.id === prop), `${sc.id}/${id}: prop ${prop}`).toBe(true);
        for (const npc of refs.npcs) { expect(getNpc3D(npc), `${id}: npc ${npc} is in the cast`).toBeDefined(); expect(sc.npcs.some((n) => n.npc === npc), `${sc.id}/${id}: ${npc} stands in the scene`).toBe(true); }
      }
    }
  });
  it('a reaction cinematic sets the state its reaction promises (so skipping or a reload ends in the same world)', () => {
    for (const sc of scenes) for (const r of sc.reactions ?? []) {
      if (!r.cinematic) continue;
      const cues = sortedCues(CINEMATICS[r.cinematic]!);
      expect(cues.some((q) => q.do === 'prop' && q.id === r.prop && q.state === r.state), `${sc.id}: ${r.cinematic} must set ${r.prop} to ${r.state}`).toBe(true);
    }
  });
  it('cues are inside the cinematic and the camera is always handed back to the player', () => {
    for (const [id, c] of Object.entries(CINEMATICS)) {
      expect(c.cues.every((q) => q.t >= 0), id).toBe(true);
      const cams = sortedCues(c).filter((q) => q.do === 'cam');
      if (cams.length) expect(cams[cams.length - 1]!.do === 'cam' && (cams[cams.length - 1] as { at: unknown }).at, `${id} ends on the player`).toBe('player');
    }
  });
  it('a cinematic that waits on a machine names a prop that exists in the scenes that play it, and no sheet is long enough to be a chore', () => {
    for (const sc of scenes) for (const r of sc.reactions ?? []) {
      const c = r.cinematic ? CINEMATICS[r.cinematic] : undefined; if (!c) continue;
      for (const q of c.cues) if (q.do === 'await') expect(sc.props.some((p) => p.id === q.id), `${c.id}: awaits ${q.id}`).toBe(true);
      const len = c.len ?? 0; expect(len, `${c.id} is ${len}s`).toBeLessThan(11.5);
    }
  });
  it('every quest completes with a banner naming the quest and its reward, and a line from the person who gave it', () => {
    for (const q of quests) {
      const c = cinematicFor(`quest:${q.id}`)!;
      expect(c, q.id).toBeDefined();
      const banner = c.cues.find((x) => x.do === 'banner'); expect(banner && 'title' in banner && banner.title).toBe(q.title);
      expect(c.cues.some((x) => x.do === 'say' && x.who === q.giver), `${q.id} has a line from ${q.giver}`).toBe(true);
    }
  });
});

describe('training scenes', () => {
  const kinds = ['python', 'data', 'web', 'stats', 'sheet'];
  it('every kind of training has a short scene that only uses what the Simulation Room has', () => {
    const room = scenes.find((s) => s.id === 'sim-room')!;
    for (const k of kinds) {
      const c = CINEMATICS[`training:${k}`]!; expect(c, k).toBeDefined();
      expect(c.len ?? 0).toBeLessThan(11.5);
      const refs = referencedIds(c);
      expect(refs.props, k).toEqual([]);
      for (const n of refs.npcs) expect(room.npcs.some((x) => x.npc === n), `${k}: ${n}`).toBe(true);
      expect(sortedCues(c).some((q) => q.do === 'player' && q.anim), `${k} has the player doing something`).toBe(true);
      expect(sortedCues(c).some((q) => q.do === 'banner'), k).toBe(true);
    }
  });
  it('the scenes differ by skill family', () => {
    const acts = kinds.map((k) => JSON.stringify(CINEMATICS[`training:${k}`]!.cues.filter((q) => q.do === 'player' || q.do === 'say' || q.do === 'flash')));
    expect(new Set(acts).size).toBe(kinds.length);
  });
});

describe('cutaways', () => {
  it('every reaction that cuts away names a cutaway that exists, in a scene that exists', () => {
    for (const sc of scenes) for (const r of sc.reactions ?? []) if (r.then) {
      const c = cutawayFor(r.then); expect(c, `${sc.id}: ${r.then}`).toBeDefined();
      expect(scenes.some((x) => x.id === c!.scene), r.then).toBe(true);
      expect(CINEMATICS[c!.cinematic], `${r.then} plays ${c!.cinematic}`).toBeDefined();
    }
  });
  it('a cutaway sheet only uses props and people that stand in the place it plays, is short, and returns the camera', () => {
    for (const [id, cw] of Object.entries(CUTAWAYS)) {
      const sc = scenes.find((x) => x.id === cw.scene)!, c = CINEMATICS[cw.cinematic]!;
      const refs = referencedIds(c);
      for (const prop of refs.props) expect(sc.props.some((p) => p.id === prop), `${id}: prop ${prop} in ${sc.id}`).toBe(true);
      for (const n of refs.npcs) expect(sc.npcs.some((x) => x.npc === n), `${id}: ${n} in ${sc.id}`).toBe(true);
      expect(c.len ?? 0, id).toBeLessThan(11.5);
      const cams = sortedCues(c).filter((q) => q.do === 'cam'); expect((cams[cams.length - 1] as { at: unknown }).at, id).toBe('player');
    }
  });
  it('the baseball sequences cover hitting, a forecast, fielding, pitching and base running, driven by a real play', () => {
    const plays = ['seq-roster', 'seq-ranking', 'seq-clean', 'seq-stats', 'seq-positions'].map((k) => (CINEMATICS[k]!.cues.find((q) => q.do === 'prop' && q.play?.startsWith('seq:')) as { play: string }).play.split(':')[1]);
    expect(new Set(plays).size).toBe(5);
  });
});
