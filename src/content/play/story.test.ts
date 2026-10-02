import { describe, expect, it } from 'vitest';
import { newSave } from '../../core/save';
import { referencedIds, sortedCues } from '../../play/logic/cinematic';
import { stagesReached } from '../../play/logic/restoration';
import { CINEMATICS } from './cinematics';
import { getNpc3D } from './cast';
import { OPENING_LINES } from './openingText';
import { ENDING, OPENING, START } from './opening';
import { scenes } from './scenes';

const scene = (id: string) => scenes.find((s) => s.id === id)!;

describe('the opening and the ending as data', () => {
  it('a new game and every reset begin in the plaza at an explicitly defined start, which exists', () => {
    expect(START.scene).toBe('plaza');
    const sp = scene('plaza').spawns[START.spawn]!;
    expect(sp).toBeDefined();
    expect(Math.abs(sp.x)).toBeLessThan(1); expect(sp.z).toBeGreaterThan(10); // the south edge of the plaza, facing the core
  });
  it('every segment is in a real place, with a real spawn, and plays a sheet that exists', () => {
    for (const seg of [...OPENING, ...ENDING]) {
      expect(scene(seg.scene), seg.id).toBeDefined();
      if (typeof seg.spawn === 'string') expect(scene(seg.scene).spawns[seg.spawn], `${seg.id}: spawn ${seg.spawn}`).toBeDefined();
      expect(CINEMATICS[seg.sheet], seg.sheet).toBeDefined();
    }
  });
  it('a sheet only refers to props and people that stand in the place it plays in', () => {
    // a `keep` segment plays where the previous one left the stage
    for (const list of [OPENING, ENDING]) {
      let here = '';
      for (const seg of list) {
        if (!seg.keep || !here) here = seg.scene;
        const sc = scene(here), refs = referencedIds(CINEMATICS[seg.sheet]!);
        for (const prop of refs.props) expect(sc.props.some((p) => p.id === prop), `${seg.sheet}: prop ${prop} in ${here}`).toBe(true);
        for (const npc of refs.npcs) { expect(getNpc3D(npc), `${seg.sheet}: ${npc} is in the cast`).toBeDefined(); expect(sc.npcs.some((n) => n.npc === npc), `${seg.sheet}: ${npc} stands in ${here}`).toBe(true); }
      }
    }
  });
  it('the opening is between 45 and 90 seconds, the longest sequence in the game', () => {
    const total = OPENING.reduce((a, s) => a + (CINEMATICS[s.sheet]!.len ?? 0), 0) + OPENING.filter((s) => !s.keep).length * 0.4; // each cut dips to black for a moment
    expect(total).toBeGreaterThan(45); expect(total).toBeLessThan(90);
  });
  it('the opening shows the city at its best before the failure, and the failure before the arrival', () => {
    const ids = OPENING.map((s) => s.id);
    expect(ids.indexOf('racing-bright')).toBeLessThan(ids.indexOf('robotics-fail'));
    expect(ids.indexOf('plaza-fail')).toBeLessThan(ids.indexOf('arrive'));
    for (const seg of OPENING.slice(0, ids.indexOf('arrive'))) expect(seg.pristine, `${seg.id} shows the place as it was`).toBe(true);
    for (const seg of OPENING.slice(ids.indexOf('arrive'))) expect(seg.pristine, `${seg.id} is the real world`).toBeFalsy();
  });
  it('Juno says exactly what the story says, in order, and the sheets put the same words on screen', () => {
    const say = ['opening:juno', 'opening:final'].flatMap((id) => sortedCues(CINEMATICS[id]!).filter((q) => q.do === 'say').map((q) => (q as { text: string }).text));
    expect(say).toEqual(OPENING_LINES.map((l) => l.text));
    expect(OPENING_LINES.map((l) => l.text)).toEqual(['Bytehaven wasn’t always like this.', 'Every system here was designed to work with the others.', 'Then everything went offline.', 'We need someone who can learn how to bring it back.', 'You’re the only one who can save us.']);
  });
  it('the opening ends on its last line: the line is the final thing said, a pause follows it, and the camera is handed back to the player', () => {
    const ids = OPENING.map((s) => s.id);
    expect(ids[ids.length - 1]).toBe('final');
    const cues = sortedCues(CINEMATICS['opening:final']!), say = cues.filter((q) => q.do === 'say');
    const last = say[say.length - 1] as { text: string; t: number; for?: number };
    expect(last.text).toBe(OPENING_LINES[OPENING_LINES.length - 1]!.text);
    expect(CINEMATICS['opening:final']!.len! - (last.t + (last.for ?? 0))).toBeGreaterThan(1); // the line is allowed to land before anything else happens
    expect(cues.some((q) => q.do === 'cam' && q.at === 'player')).toBe(true);
  });
  it('every spoken line names its speaker (subtitles have a speaker and good contrast)', () => {
    for (const id of ['opening:juno', 'opening:worlds', 'opening:final', 'ending:summit', 'ending:plaza', 'ending:after']) for (const q of CINEMATICS[id]!.cues) if (q.do === 'say' && id !== 'ending:after') expect(q.who, `${id}: ${q.text}`).toBeDefined();
  });
  it('the ending ends with the line the story promises, after the credits, in the real plaza', () => {
    const ids = ENDING.map((s) => s.id);
    expect(ids.indexOf('credits')).toBeLessThan(ids.indexOf('after'));
    expect(ENDING.find((s) => s.id === 'credits')!.credits).toBe(true);
    expect(CINEMATICS['ending:after']!.cues.some((q) => q.do === 'say' && q.text === 'Bytehaven is alive again.')).toBe(true);
    expect(CINEMATICS['ending:after']!.cues.some((q) => q.do === 'say' && q.text === 'There they are.')).toBe(true);
    expect(CINEMATICS['ending:after']!.cues.some((q) => q.do === 'say' && q.text === 'The one who brought Bytehaven back.')).toBe(true);
    expect(OPENING.concat(ENDING).filter((s) => s.scene === 'plaza' && !s.pristine && !s.dark && !s.keep).length).toBeGreaterThan(0);
  });
});

describe('the Training Grounds answers a finished plan in the way of its family of skill', () => {
  const kinds = ['python', 'data', 'web', 'stats', 'sheet'];
  it('every family has its own scene, using only what the Simulation Room holds, and the coach reacts', () => {
    const room = scene('sim-room');
    for (const k of kinds) {
      const c = CINEMATICS[`trainwin:${k}`]!; expect(c, k).toBeDefined();
      const refs = referencedIds(c);
      for (const p of refs.props) expect(room.props.some((x) => x.id === p), `${k}: ${p}`).toBe(true);
      for (const n of refs.npcs) expect(room.npcs.some((x) => x.npc === n), `${k}: ${n}`).toBe(true);
      expect(sortedCues(c).some((q) => q.do === 'prop' && q.state), `${k} makes something work`).toBe(true);
      expect(sortedCues(c).some((q) => q.do === 'npc' && q.anim), `${k}: the coach reacts`).toBe(true);
      expect(c.len ?? 0).toBeLessThan(11.5);
    }
    expect(new Set(kinds.map((k) => (sortedCues(CINEMATICS[`trainwin:${k}`]!).find((q) => q.do === 'prop' && q.state) as { id: string }).id)).size).toBe(kinds.length);
  });
});

describe('milestones', () => {
  it('there is a sheet for every district at every stage, in that district\'s own words and none longer than a moment', () => {
    for (const w of ['robotics', 'academy', 'ballpark', 'racing']) for (const st of [1, 2, 3, 4]) {
      const c = CINEMATICS[`milestone:${w}:${st}`]!; expect(c, `${w} ${st}`).toBeDefined();
      expect(c.len ?? 0).toBeLessThan(9);
      expect(sortedCues(c).some((q) => q.do === 'power' && q.k === 'save'), 'hands the glow back to the player\'s restoration').toBe(true);
      expect(referencedIds(c).props).toEqual([]); // written against the player: it plays in any scene of the district
    }
    const lines = ['robotics', 'academy', 'ballpark', 'racing'].map((w) => JSON.stringify(CINEMATICS[`milestone:${w}:2`]!.cues.filter((q) => q.do === 'cam' || q.do === 'say')));
    expect(new Set(lines).size).toBe(4);
  });
  it('a stage is noticed once, when the player\'s work carries a district over a quarter, a half, three quarters or all of it', () => {
    const s = newSave();
    expect(stagesReached({}, s)).toEqual([]);
    s.campaign.completedAt = new Date().toISOString();
    expect(stagesReached({ robotics: 4, academy: 3, ballpark: 0, racing: 4 }, s).map((x) => `${x.world}:${x.stage}`)).toEqual(['academy:4', 'ballpark:4']);
  });
});
