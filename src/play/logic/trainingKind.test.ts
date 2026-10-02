import { describe, expect, it } from 'vitest';
import { worlds } from '../../content/worlds';
import { trainingKindOf } from './trainingKind';

describe('trainingKind', () => {
  it('every world maps to a scene', () => { for (const w of worlds) expect(['python', 'data', 'web', 'stats', 'sheet']).toContain(trainingKindOf(w.track)); });
  it('families', () => { expect(trainingKindOf('sql')).toBe('data'); expect(trainingKindOf('r')).toBe('stats'); expect(trainingKindOf('sheets')).toBe('sheet'); expect(trainingKindOf('web')).toBe('web'); });
});
