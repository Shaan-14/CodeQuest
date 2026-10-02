import { describe, expect, it } from 'vitest';
import type { Segment } from '../../content/play/opening';
import type { SceneDef } from '../../play/logic/sceneTypes';
import type { Stage } from '../engine/stage';
import { playSegments, type SeqHost } from './sequencer';

/** A stage that records what the sequencer asks of it (the real one needs WebGL). `ready` = the places it has already prepared. */
function fakeStage(log: string[], o: { prepared: boolean; sheetMs: number }): Stage {
  const ready = new Set<string>(); let until = 0;
  return {
    playCinematic: (ref: string) => { log.push(`play ${ref}`); until = Date.now() + o.sheetMs; return ref !== 'missing'; },
    director: {
      whenIdle: () => new Promise<void>((res) => setTimeout(res, Math.max(0, until - Date.now()))),
      remaining: () => Math.max(0, (until - Date.now()) / 1000),
      hold: (on: boolean) => log.push(`hold ${on}`),
    },
    setPlayerVisible: (v: boolean) => log.push(`player ${v}`),
    setControlLocked: (v: boolean) => log.push(`locked ${v}`),
    setPowerOverride: (k: number | null, over?: number, motion?: number) => log.push(`power ${k} ${over} ${motion}`),
    prepare: (d: SceneDef, pristine: boolean) => { log.push(`prepare ${d.id} ${pristine}`); if (o.prepared) ready.add(d.id); },
    isPrepared: (id: string) => ready.has(id),
    whenPrepared: () => { ready.add('*'); return Promise.resolve(); },
    cancelPrepare: () => log.push('cancel'),
  } as unknown as Stage;
}
function host(log: string[], o: { skipAfter?: number; credits?: boolean; prepared?: boolean; sheetMs?: number } = {}): SeqHost {
  const stage = fakeStage(log, { prepared: o.prepared ?? true, sheetMs: o.sheetMs ?? 5 }); let plays = 0;
  return {
    stage: () => stage,
    scene: (id) => ({ id } as SceneDef),
    load: (scene, spawn, opts) => log.push(`load ${scene} ${typeof spawn === 'string' ? spawn : ''} power=${opts.power} pristine=${opts.pristine}`),
    fade: (to, ms) => log.push(`fade ${to} ${ms}`),
    skipped: () => (o.skipAfter !== undefined && plays++ >= o.skipAfter),
    credits: o.credits ? async () => { log.push('credits'); } : undefined,
  };
}
const seg = (o: Partial<Segment> & { id: string }): Segment => ({ scene: 'plaza', sheet: `sheet-${o.id}`, ...o });
const loads = (log: string[]) => log.filter((l) => l.startsWith('load'));

describe('the sequencer', () => {
  it('shows each place as asked, locks the controls, plays its sheet and brings the picture up on it', async () => {
    const log: string[] = [];
    const r = await playSegments(host(log), [seg({ id: 'a', pristine: true, power: 1, player: false }), seg({ id: 'b', scene: 'track', spawn: 'paddock', player: true })]);
    expect(r).toBe('done');
    expect(log.indexOf('load plaza  power=1 pristine=true')).toBeLessThan(log.indexOf('play sheet-a'));
    expect(log).toContain('load track paddock power=null pristine=false'); // the real world: no override, nothing applied that was not earned
    expect(log).toContain('player false'); expect(log).toContain('player true'); expect(log).toContain('locked true');
  });
  it('the next place is built while the current shot plays, and the picture dissolves out before the cut and in after it: black is a beat, not a stall', async () => {
    const log: string[] = [];
    await playSegments(host(log, { sheetMs: 700 }), [seg({ id: 'a' }), seg({ id: 'b', scene: 'track' })], { startLoaded: true });
    const i = (s: string) => log.indexOf(s);
    expect(i('prepare track false')).toBeLessThan(i('play sheet-a') + 3); // prepared as the first sheet starts
    expect(i('prepare track false')).toBeLessThan(i('fade black 420'));
    expect(i('fade black 420')).toBeLessThan(i('load track  power=null pristine=false'));
    expect(i('load track  power=null pristine=false')).toBeLessThan(i('play sheet-b'));
    expect(log.slice(i('play sheet-b'))).toContain('fade clear 720');
    expect(log.filter((l) => l.startsWith('fade black')).length).toBe(1); // a prepared place is never waited for behind black
  });
  it('a place that was not ready in time is waited for behind the dissolve, never shown half built', async () => {
    const log: string[] = [];
    await playSegments(host(log, { prepared: false }), [seg({ id: 'a' }), seg({ id: 'b', scene: 'track' })]);
    const i = (s: string) => log.indexOf(s);
    expect(i('fade black 420')).toBeGreaterThan(-1);
    expect(i('fade black 420')).toBeLessThan(i('load track  power=null pristine=false'));
  });
  it('the first place can already be on the stage (a new game builds it while the title is black) and then comes up slowly', async () => {
    const log: string[] = [];
    await playSegments(host(log), [seg({ id: 'a', fadeIn: 1400 })], { startLoaded: true });
    expect(loads(log)).toHaveLength(0);
    expect(log).toContain('fade clear 1400');
  });
  it('a `keep` segment carries on in the place already shown: no cut, no reload, no dissolve, and the shot is held between sheets', async () => {
    const log: string[] = [];
    await playSegments(host(log), [seg({ id: 'a' }), seg({ id: 'b', keep: true })], { startLoaded: true });
    expect(loads(log)).toHaveLength(0);
    expect(log.filter((l) => l.startsWith('fade clear'))).toHaveLength(1);
    expect(log.filter((l) => l.startsWith('fade black'))).toHaveLength(0);
    expect(log).toContain('play sheet-b');
    expect(log[0]).toBe('hold true');
    expect(log[log.length - 1]).toBe('hold false'); // control of the camera is always handed back
  });
  it('a `dark` segment loads stopped and unpowered, ready for a sheet that brings it back', async () => {
    const log: string[] = [];
    await playSegments(host(log), [seg({ id: 'a', dark: true, pristine: true })]);
    expect(log).toContain('load plaza  power=0 pristine=true');
    expect(log).toContain('power 0 0 0');
  });
  it('credits roll alongside their sheet, and the sequence waits for both', async () => {
    const log: string[] = [];
    await playSegments(host(log, { credits: true }), [seg({ id: 'a' }), seg({ id: 'c', keep: true, credits: true })]);
    expect(log).toContain('credits');
  });
  it('skipping stops the sequence at once, cancels what was being built and hands the camera back; nothing more is shown or played', async () => {
    const log: string[] = [];
    const r = await playSegments(host(log, { skipAfter: 2 }), [seg({ id: 'a' }), seg({ id: 'b' }), seg({ id: 'c' }), seg({ id: 'd' })]);
    expect(r).toBe('skipped');
    expect(log).not.toContain('play sheet-d');
    expect(log).toContain('cancel');
    expect(log[log.length - 1]).toBe('hold false');
  });
  it('a missing sheet is skipped over, never a crash', async () => {
    const log: string[] = [];
    expect(await playSegments(host(log), [seg({ id: 'x', sheet: 'missing' }), seg({ id: 'y' })])).toBe('done');
    expect(log).toContain('play sheet-y');
  });
});
