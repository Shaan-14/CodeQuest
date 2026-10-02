import { describe, expect, it } from 'vitest';
import { items } from '../content/world';
import { playerLook } from '../content/play/looks';
import { migrate, newSave, SAVE_VERSION } from '../core/save';
import { buyItem } from './actions';
import { equipGear } from './play';

const rich = () => { const s = newSave(); s.stats.coins = 1000; return s; };

describe('gear (the Pack)', () => {
  it('every cosmetic is wearable: a slot and something it changes; nothing else is', () => {
    for (const i of items) {
      if (i.kind === 'cosmetic') { expect(i.slot, i.id).toBeDefined(); expect(i.wear && (i.wear.hat || i.wear.accessory), i.id).toBeTruthy(); expect(i.price, i.id).not.toBeNull(); }
      else { expect(i.slot, i.id).toBeUndefined(); expect(i.price, i.id).toBeNull(); }
    }
  });
  it('nothing for sale gives XP, Focus, hints or answers (looks only)', () => {
    for (const i of items.filter((x) => x.price !== null)) expect(i.kind).toBe('cosmetic');
  });
  it('buying gear puts it on, and it changes the avatar in the world', () => {
    const r = buyItem(rich(), 'lucky-cap');
    expect(r.save.play.gear.head).toBe('lucky-cap');
    expect(playerLook('spellwright', r.save.play.gear).hat).toBe('cap');
    const c = buyItem(r.save, 'explorer-cape');
    expect(playerLook('spellwright', c.save.play.gear).accessory).toBe('cape');
    expect(playerLook('spellwright').accessory).toBe('techpack');
  });
  it('you can only wear what you own, in its own slot, and take it off', () => {
    const s = rich();
    expect(equipGear(s, 'head', 'lucky-cap').save.play.gear.head).toBeNull(); // not owned
    const own = buyItem(buyItem(s, 'lucky-cap').save, 'trail-visor').save; // the visor replaces the cap
    expect(own.play.gear.head).toBe('trail-visor');
    expect(equipGear(own, 'head', 'lucky-cap').save.play.gear.head).toBe('lucky-cap');
    expect(equipGear(own, 'back', 'lucky-cap').save.play.gear.back).toBeNull(); // wrong slot
    expect(equipGear(own, 'head', null).save.play.gear.head).toBeNull();
  });
  it('costs coins and never goes below zero', () => {
    const s = newSave(); s.stats.coins = 10;
    expect(buyItem(s, 'explorer-cape').save.inventory['explorer-cape']).toBeUndefined();
    const r = buyItem(rich(), 'explorer-cape'); expect(r.save.stats.coins).toBe(920);
  });
  it('a v9 save keeps what it owned, now worn', () => {
    const v9 = { ...newSave(), version: 9, inventory: { 'explorer-cape': 1, 'lucky-cap': 1 }, play: { scene: null, pos: null, talked: {}, seen: {}, settings: { muted: false, reducedMotion: null, quality: 'medium' } } };
    const m = migrate(v9)!;
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.play.gear).toEqual({ head: 'lucky-cap', back: 'explorer-cape' });
    expect(migrate({ ...v9, inventory: {} })!.play.gear).toEqual({ head: null, back: null });
  });
});
