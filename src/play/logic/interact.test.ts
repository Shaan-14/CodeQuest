import { describe, expect, it } from 'vitest';
import { nearestInteractable, promptText } from './interact';
import type { Interactable } from './sceneTypes';

const mk = (id: string, x: number, z: number, verb = 'Talk', label = 'Someone', range?: number): Interactable => ({ id, verb, label, x, z, range, action: { type: 'inspect', id, text: '' } });

describe('interaction', () => {
  it('offers nothing when nothing is close enough', () => { expect(nearestInteractable(0, 0, 0, [mk('a', 10, 0)])).toBeNull(); });
  it('offers the thing in range, and only while close enough', () => {
    const a = mk('a', 0, -2);
    expect(nearestInteractable(0, 0, 0, [a])?.id).toBe('a');
    expect(nearestInteractable(0, 3, 0, [a])).toBeNull();
  });
  it('prefers the nearer of two overlapping things (no flicker)', () => {
    expect(nearestInteractable(0, 0, 0, [mk('far', 0, -2), mk('near', 0, -1)])?.id).toBe('near');
  });
  it('does not offer something behind the player, unless very close', () => {
    expect(nearestInteractable(0, 0, 0, [mk('behind', 0, 2)])).toBeNull(); // facing north, it is south
    expect(nearestInteractable(0, 0, 0, [mk('touching', 0, 0.6)])?.id).toBe('touching');
  });
  it('honours a custom range', () => {
    const it = mk('wide', 0, -3, 'Use', 'Console', 3.5);
    expect(nearestInteractable(0, 0, 0, [it])?.id).toBe('wide');
  });
  it('prompts in the [E] Verb Label form', () => {
    expect(promptText(mk('a', 0, 0, 'Talk', 'Mentor Juno'))).toBe('[E] Talk to Mentor Juno');
    expect(promptText(mk('b', 0, 0, 'Use', 'the Console'))).toBe('[E] Use the Console');
    expect(promptText(mk('c', 0, 0, 'Play ball', ''))).toBe('[E] Play ball');
  });
});
