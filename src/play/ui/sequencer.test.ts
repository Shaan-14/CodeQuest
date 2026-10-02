import { describe, expect, it } from 'vitest';
import type { Segment } from '../../content/play/opening';
import type { Stage } from '../engine/stage';
import { playSegments, type SeqHost } from './sequencer';

/** A stage that records what the sequencer asks of it (the real one needs WebGL). */
function fakeStage(log: string[]): Stage {
  return {
    playCinematic: (ref: string) => { log.push(`play ${ref}`); return ref !== 'missing'; },
    director: { whenIdle: () => Promise.resolve() },
    setPlayerVisible: (v: boolean) => log.push(`player ${v}`),
    setControlLocked: (v: boolean) => log.push(`locked ${v}`),
    setPowerOverride: (k: number | null, over?: number, motion?: number) => log.push(`power ${k} ${over} ${motion}`),
  } as unknown as Stage;
}
function host(log: string[], o: { skipAfter?: number; credits?: boolean } = {}): SeqHost {
  const stage = fakeStage(log); let plays = 0;
  return {
    stage: () => stage,
    load: (scene, spawn, opts) => log.push(`load ${scene} ${typeof spawn === 'string' ? spawn : ''} power=${opts.power} pristine=${opts.pristine}`),
    curtain: async (on) => { log.push(on ? 'dark' : 'light'); },
    skipped: () => (o.skipAfter !== undefined && plays++ >= o.skipAfter),
    credits: o.credits ? async () => { log.push('credits'); } : undefined,
  };
}
const seg = (o: Partial<Segment> & { id: string }): Segment => ({ scene: 'plaza', sheet: `sheet-${o.id}`, ...o });

describe('the sequencer', () => {
  it('cuts to each place under a quick dip, shows it as asked, locks the controls and plays its sheet', async () => {
    const log: string[] = [];
    const r = await playSegments(host(log), [seg({ id: 'a', pristine: true, power: 1, player: false }), seg({ id: 'b', scene: 'track', spawn: 'paddock', player: true })]);
    expect(r).toBe('done');
    expect(log.slice(0, 7)).toEqual(['dark', 'load plaza  power=1 pristine=true', 'player false', 'locked true', 'play sheet-a', 'light', 'dark']);
    expect(log).toContain('load track paddock power=null pristine=false'); // the real world: no override, nothing applied that was not earned
    expect(log).toContain('player true');
  });
  it('a `keep` segment carries on in the place already shown: no cut, no reload', async () => {
    const log: string[] = [];
    await playSegments(host(log), [seg({ id: 'a' }), seg({ id: 'b', keep: true })]);
    expect(log.filter((l) => l.startsWith('load'))).toHaveLength(1);
    expect(log.filter((l) => l === 'dark')).toHaveLength(1);
    expect(log).toContain('play sheet-b');
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
  it('skipping stops the sequence at once, and nothing more is shown or played', async () => {
    const log: string[] = [];
    const r = await playSegments(host(log, { skipAfter: 2 }), [seg({ id: 'a' }), seg({ id: 'b' }), seg({ id: 'c' }), seg({ id: 'd' })]);
    expect(r).toBe('skipped');
    expect(log.filter((l) => l.startsWith('play')).length).toBeLessThan(3);
    expect(log).not.toContain('play sheet-d');
  });
  it('a missing sheet is skipped over, never a crash', async () => {
    const log: string[] = [];
    expect(await playSegments(host(log), [seg({ id: 'x', sheet: 'missing' }), seg({ id: 'y' })])).toBe('done');
    expect(log).toContain('play sheet-y');
  });
});
