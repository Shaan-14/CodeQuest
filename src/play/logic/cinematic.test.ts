import { describe, expect, it } from 'vitest';
import { changesWorld, cuesBetween, lengthOf, referencedIds, sortedCues, type Cinematic } from './cinematic';

const c: Cinematic = { id: 't', cues: [
  { t: 2, do: 'say', text: 'second' }, { t: 0, do: 'cam', at: { prop: 'bolt' } }, { t: 2, do: 'prop', id: 'bolt', state: 'eyes' }, { t: 1, do: 'npc', id: 'juno', face: { prop: 'bolt' }, point: { at: [1, 2] } },
] };

describe('cinematic cue sheets', () => {
  it('fire in time order, and in written order at equal times', () => {
    const s = sortedCues(c);
    expect(s.map((q) => q.do)).toEqual(['cam', 'npc', 'say', 'prop']);
  });
  it('report the cues between two moments (start exclusive, end inclusive)', () => {
    const s = sortedCues(c);
    expect(cuesBetween(s, 0, 1).map((q) => q.do)).toEqual(['npc']);
    expect(cuesBetween(s, 1, 2).map((q) => q.do)).toEqual(['say', 'prop']);
    expect(cuesBetween(s, 2, 9)).toEqual([]);
  });
  it('last a little longer than the last cue unless a length is given', () => {
    expect(lengthOf(c)).toBeGreaterThan(2 + 3);
    expect(lengthOf({ ...c, len: 9 })).toBe(9);
  });
  it('say which props and people a cinematic refers to', () => {
    const r = referencedIds(c);
    expect(r.props.sort()).toEqual(['bolt']); expect(r.npcs).toEqual(['juno']);
  });
  it('know which cues change the world (those still run when the cinematic is skipped)', () => {
    expect(changesWorld({ do: 'prop', id: 'x', state: 'open' })).toBe(true);
    expect(changesWorld({ do: 'prop', id: 'x', play: 'weld' })).toBe(false);
    expect(changesWorld({ do: 'banner', title: 'x' })).toBe(true);
    expect(changesWorld({ do: 'say', text: 'x' })).toBe(false);
    expect(changesWorld({ do: 'fx', kind: 'sparks', at: { player: true } })).toBe(false);
  });
});
