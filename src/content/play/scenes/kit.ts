/** Helpers for writing scene data: rooms made of walls, colours shared by a world, and a few composed props. Pure data, no three.js. */
import type { Prop } from '../../../play/logic/sceneTypes';

export const C = {
  steel: 0x596080, dark: 0x2a2f45, panel: 0x39405c, yellow: 0xf2c14e, orange: 0xff9f1c, cyan: 0x4fd1ff, green: 0x7dffb3, red: 0xff4d4d, white: 0xe5e9f5, floor: 0x3a4058, floor2: 0x444b66,
};

/** The four walls of a rectangular room (north wall = -Z). A gap can be left on any side for a doorway: `gaps` = { south: [centre, width] }. */
export function room(minX: number, maxX: number, minZ: number, maxZ: number, o: { h?: number; color?: number; trim?: number; gaps?: Partial<Record<'north' | 'south' | 'east' | 'west', [number, number]>>; t?: number } = {}): Prop[] {
  const h = o.h ?? 4, t = o.t ?? 0.4, color = o.color ?? C.steel, trimColor = o.trim ?? C.yellow;
  const out: Prop[] = [];
  const wallX = (z: number, side: 'north' | 'south') => {
    const gap = o.gaps?.[side];
    const w = maxX - minX;
    const seg = (x0: number, x1: number) => { if (x1 - x0 > 0.05) out.push({ kind: 'wall', x: (x0 + x1) / 2, z, p: { w: x1 - x0, h, d: t, color, trimColor }, solid: { w: x1 - x0, d: t } }); };
    if (!gap) seg(minX, maxX); else { seg(minX, gap[0] - gap[1] / 2); seg(gap[0] + gap[1] / 2, maxX); }
    void w;
  };
  const wallZ = (x: number, side: 'east' | 'west') => {
    const gap = o.gaps?.[side];
    const seg = (z0: number, z1: number) => { if (z1 - z0 > 0.05) out.push({ kind: 'wall', x, z: (z0 + z1) / 2, ry: Math.PI / 2, p: { w: z1 - z0, h, d: t, color, trimColor }, solid: { w: z1 - z0, d: t } }); };
    if (!gap) seg(minZ, maxZ); else { seg(minZ, gap[0] - gap[1] / 2); seg(gap[0] + gap[1] / 2, maxZ); }
  };
  wallX(minZ, 'north'); wallX(maxZ, 'south'); wallZ(minX, 'west'); wallZ(maxX, 'east');
  return out;
}

/** Hazard stripes on the floor. */
export const stripe = (x: number, z: number, w: number, d: number): Prop => ({ kind: 'floor', x, z, p: { w, d, color: C.yellow, color2: 0x222222, tile: 0.5, lines: false, lift: 0.02 } });
