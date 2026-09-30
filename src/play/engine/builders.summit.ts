/** The Summit: guardian beacons, the outage control tower and the great beacon whose ignition ends the campaign. */
import { Group } from 'three';
import { ease } from './tween';
import { mat, shape } from './kit';
import { col, num, type Builder, type Dyn } from './builders';

/** A beacon tower. `light` lights its lamp (a guardian beaten); `ignite` (the great beacon) sends a beam into the sky and brings the dawn. */
const beacon: Builder = (p, ctx) => {
  const g = new Group(); const c = col(p, 'color', 0xffd166); const big = num(p, 'big', 0) > 0;
  const h = big ? 9 : 5;
  g.add(shape('cyl', big ? 3.2 : 1.6, h * 0.5, big ? 3.2 : 1.6, 0x596080), shape('cyl', big ? 2.4 : 1.2, h * 0.5, big ? 2.4 : 1.2, 0x39405c, { y: h * 0.5 }), shape('cyl', big ? 3.4 : 1.8, 0.3, big ? 3.4 : 1.8, 0x7a84a8, { y: h }));
  const lamp = shape('sphere', big ? 2.0 : 1.0, big ? 2.0 : 1.0, big ? 2.0 : 1.0, 0x3a3f58, { y: h + 0.4 }); g.add(lamp);
  const beam = shape('cyl', big ? 3 : 1.2, 60, big ? 3 : 1.2, c, { y: h + 1, glow: 1.4, transparent: 0.35, cast: false }); beam.visible = false; g.add(beam);
  let lit = false, t = 0, fire = 0;
  const light = (instant: boolean) => {
    lit = true; lamp.material = mat(c, 1.6); beam.visible = true;
    if (!instant) { ctx.audio.sfx('quest'); ctx.fx.burst('magic', p.x, h + 1, p.z, 40, 1.4); ctx.fx.flash(p.x, h + 1, p.z, c, 12, 1); }
  };
  const dyn: Dyn = {
    id: p.id ?? 'beacon', object: g, at: () => ({ x: p.x, y: h, z: p.z }), states: () => (lit ? ['lit'] : []),
    setState(s, instant) {
      if (s === 'light' && !lit) light(instant);
      if (s === 'ignite' && !lit) {
        light(instant);
        if (!instant) { fire = 7; ctx.audio.sfx('cheer'); ctx.tweens.add(6, (k) => ctx.mood(k), { ease: ease.inOut }); ctx.say('The great beacon ignites. A column of light climbs into the sky and the dark lifts from every district of Bytehaven.'); }
        else ctx.mood(1);
      }
    },
    update(dt) {
      t += dt;
      if (lit) { lamp.scale.setScalar((big ? 2 : 1) * (1 + Math.sin(t * 3) * 0.04)); beam.scale.x = beam.scale.z = (big ? 3 : 1.2) * (1 + Math.sin(t * 2) * 0.05); }
      if (fire > 0) { fire -= dt; if (Math.floor(fire * 3) !== Math.floor((fire + dt) * 3)) { const a = Math.random() * 6.28, r = 6 + Math.random() * 8; ctx.fx.burst('confetti', p.x + Math.cos(a) * r, 8 + Math.random() * 6, p.z + Math.sin(a) * r, 26, 1.6); ctx.fx.flash(p.x + Math.cos(a) * r, 10, p.z + Math.sin(a) * r, [0xffd166, 0xff5d73, 0x5ee6d0][Math.floor(Math.random() * 3)]!, 9, 0.5); } }
    },
  };
  return { object: g, dyn };
};

/** The outage control tower: a low tower with a panel ring; the place where the final problem is faced. */
const controlTower: Builder = () => { const g = new Group(); g.add(shape('cyl', 7, 1.0, 7, 0x39405c), shape('cyl', 5.4, 0.6, 5.4, 0x596080, { y: 1.0 }), shape('box', 4, 2.4, 0.4, 0x11131f, { y: 2.4, z: -2.4 })); return { object: g }; };

/** Rocky peaks for the mountaintop. */
const peak: Builder = (p) => { const g = new Group(); const s = num(p, 'scale', 1); g.add(shape('cone', 14 * s, 18 * s, 14 * s, 0x5b6078), shape('cone', 6 * s, 6 * s, 6 * s, 0xe8ecf7, { y: 13 * s })); return { object: g }; };

export const summitBuilders: Record<string, Builder> = { beacon, controlTower, peak };
