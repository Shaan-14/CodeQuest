/** Harborview Park props: the field, stands, fences, dugout, light towers and the TEAM (players who appear when the analysis sets a lineup, and play the simulated game). */
import { CanvasTexture, Group, Mesh, MeshBasicMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace, SphereGeometry } from 'three';
import type { Play } from '../logic/baseballSim';
import { createRig, type Rig } from './rig';
import { ease } from './tween';
import { mat, shape, sign } from './kit';
import { col, num } from './props';
import type { Builder, BuildCtx, Dyn } from './builders';

const GRASS1 = 0x3f8f4f, GRASS2 = 0x4ba05a, DIRT = 0xc08a52;

/** Positions (relative to home plate; north is -z). Baselines are 14 m, scaled to be walkable. */
export const BASE = { home: [0, 0], first: [9.9, -9.9], second: [0, -19.8], third: [-9.9, -9.9] } as const;
export const POS: Record<string, [number, number]> = { P: [0, -9.4], C: [0, 1.4], '1B': [8.5, -9], '2B': [4, -16.5], SS: [-4, -16.5], '3B': [-8.5, -9], LF: [-16, -26], CF: [0, -30], RF: [16, -26] };
const FENCE_R = 38;

const crowdTexture = (() => {
  let t: CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas'); c.width = 128; c.height = 32; const g = c.getContext('2d')!;
    g.fillStyle = '#26304d'; g.fillRect(0, 0, 128, 32);
    const cols = ['#ff5d73', '#ffd166', '#06d6a0', '#4fd1ff', '#f2f2f2', '#b48cff', '#ff9f1c'];
    for (let i = 0; i < 90; i++) { g.fillStyle = cols[i % cols.length]!; g.fillRect((i * 37) % 124, ((i * 13) % 6) * 5 + 2, 4, 4); }
    t = new CanvasTexture(c); t.wrapS = RepeatWrapping; t.colorSpace = SRGBColorSpace; t.userData.shared = true;
    return t;
  };
})();
const planeGeo = new PlaneGeometry(1, 1); planeGeo.userData.shared = true;

const diamond: Builder = () => {
  const g = new Group();
  // grass with mowing stripes
  for (let i = 0; i < 10; i++) g.add(shape('box', 84, 0.02, 7, i % 2 ? GRASS1 : GRASS2, { z: -4 - i * 7, y: 0, cast: false }));
  g.add(shape('cyl', 27, 0.04, 27, DIRT, { z: -10, y: 0.01, cast: false }));              // infield dirt
  g.add(shape('cyl', 15.5, 0.05, 15.5, GRASS2, { z: -10, y: 0.015, cast: false }));       // inner grass
  g.add(shape('cyl', 5, 0.05, 5, DIRT, { z: 0, y: 0.02, cast: false }));                  // home circle
  g.add(shape('cyl', 3.2, 0.3, 3.2, DIRT, { z: POS.P![1], y: 0.0 }));                    // mound
  for (const [x, z] of [BASE.first, BASE.second, BASE.third]) g.add(shape('box', 0.6, 0.12, 0.6, 0xffffff, { x, z, y: 0.05, ry: Math.PI / 4 }));
  g.add(shape('box', 0.6, 0.06, 0.6, 0xffffff, { z: 0, y: 0.05 }));
  // base paths and foul lines
  for (const [x, z] of [[4.95, -4.95], [4.95, -14.85], [-4.95, -14.85], [-4.95, -4.95]] as const) g.add(shape('box', 14, 0.03, 0.8, DIRT, { x, z, y: 0.03, ry: (x > 0) === (z > -10) ? -Math.PI / 4 : Math.PI / 4, cast: false }));
  g.add(shape('box', 0.15, 0.04, 40, 0xffffff, { x: 14.1, z: -20, y: 0.04, ry: Math.PI / 4 + Math.PI / 2 - Math.PI / 2, cast: false }));
  return { object: g };
};

/** The outfield fence: an arc of dark-green panels with a yellow top, and foul poles. */
const fence: Builder = () => {
  const g = new Group();
  const n = 26;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 4 - 0.12 + (i / (n - 1)) * (Math.PI / 2 + 0.24);
    const x = Math.sin(a) * FENCE_R, z = -Math.cos(a) * FENCE_R;
    g.add(shape('box', 3.6, 3, 0.5, 0x1d4d3a, { x, z, ry: -a }), shape('box', 3.7, 0.18, 0.56, 0xffd166, { x, z, y: 3, ry: -a, glow: 0.4 }));
  }
  return { object: g };
};

/** Stands: tiered rows with a crowd texture, so a full stadium is ~20 meshes. */
const stands: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 30), rows = num(p, 'rows', 6);
  for (let r = 0; r < rows; r++) {
    g.add(shape('box', w, 0.6 + r * 0.9, 1.4, 0x39405c, { z: r * 1.4, y: 0 }));
    const face = new Mesh(planeGeo, new MeshBasicMaterial({ map: crowdTexture() }));
    face.scale.set(w, 0.8, 1); face.position.set(0, 0.6 + r * 0.9 + 0.4, r * 1.4 - 0.72); face.rotation.y = Math.PI;
    g.add(face);
  }
  g.add(shape('box', w + 1, 0.3, rows * 1.4 + 1, 0x596080, { y: 0.6 + rows * 0.9 + 3.2, z: rows * 0.7 }));
  return { object: g };
};

const dugout: Builder = () => { const g = new Group(); g.add(shape('box', 7, 0.3, 2.4, 0x596080, { y: 2.3 }), shape('box', 7, 1.6, 0.2, 0x39405c, { z: -1.1 }), shape('box', 6.2, 0.15, 0.7, 0x8a5a33, { y: 0.45, z: -0.6 }), shape('box', 0.2, 2.3, 0.2, 0x596080, { x: -3.4, z: 1 }), shape('box', 0.2, 2.3, 0.2, 0x596080, { x: 3.4, z: 1 })); return { object: g }; };
const lightTower: Builder = (p) => { const g = new Group(); const h = num(p, 'h', 16); g.add(shape('cyl', 0.5, h, 0.5, 0x596080), shape('box', 4.5, 2.4, 0.4, 0xfff3c0, { y: h, glow: 1.2 }), shape('box', 4.7, 0.2, 0.5, 0x2a2f45, { y: h + 2.4 })); return { object: g }; };

/** Home plate area props: batter's box lines. */
const plate: Builder = () => { const g = new Group(); g.add(shape('box', 0.9, 0.05, 0.9, 0xffffff, { y: 0.04, ry: Math.PI / 4 }), shape('box', 0.08, 0.03, 1.8, 0xffffff, { x: -1.3, y: 0.04 }), shape('box', 0.08, 0.03, 1.8, 0xffffff, { x: 1.3, y: 0.04 }), shape('box', 2.6, 0.04, 0.08, 0xffffff, { z: -0.9, y: 0.04 }), shape('box', 2.6, 0.04, 0.08, 0xffffff, { z: 0.9, y: 0.04 })); return { object: g }; };

/**
 * THE TEAM. Before the analysis sets a lineup nobody is in position. When `set` happens nine players jog to their positions, in uniform, each
 * with their batting-order number. `run('sim', plays)` then plays a simulated game: pitch, swing, the ball's flight, the fielder, the runner.
 */
const team: Builder = (p, ctx) => {
  const g = new Group();
  const rigs = new Map<string, Rig>();
  const uniform = { body: 0x2b6cb0, head: 0xd9a877, accent: 0xffd166, hair: 0x2a1a12, hat: 'cap' as const };
  const order = ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF'];
  const nums: string[] = [];
  order.forEach((pos, i) => {
    const rig = createRig({ ...uniform, head: [0xd9a877, 0xc99267, 0xf0c9a0, 0x8d5a3b][i % 4]!, hair: [0x2a1a12, 0x1f1a1a, 0x5a3a22, 0xc94f6d][i % 4]! });
    rig.group.visible = false; g.add(rig.group); rigs.set(pos, rig); nums.push(pos);
    const [x, z] = POS[pos]!; rig.group.position.set(x, 0, z);
  });
  const batter = createRig({ ...uniform, body: 0x1d4d8f, hat: 'helmet' as const }); batter.group.visible = false; batter.group.position.set(-1.2, 0, 0.2); batter.group.rotation.y = Math.PI / 2; g.add(batter.group);
  const runner = createRig({ ...uniform, body: 0x1d4d8f, hat: 'helmet' as const }); runner.group.visible = false; g.add(runner.group);
  const ball = new Mesh(new SphereGeometry(0.16, 10, 8), new MeshBasicMaterial({ color: 0xffffff })); ball.visible = false; g.add(ball);
  const marks: Mesh[] = [BASE.first, BASE.second, BASE.third].map(([x, z]) => { const m = shape('cyl', 0.6, 0.5, 0.6, 0xffd166, { x, z, y: 0.3, glow: 1 }); m.visible = false; g.add(m); return m; });
  let isSet = false, t = 0, busy = false;
  const place = (instant: boolean) => {
    for (const [pos, rig] of rigs) {
      rig.group.visible = true;
      const [x, z] = POS[pos]!;
      if (instant || ctx.reduced) { rig.group.position.set(x, 0, z); continue; }
      const from = { x: x + (pos === 'P' ? 0 : (x > 0 ? 14 : -14)), z: z + 18 };
      rig.group.position.set(from.x, 0, from.z);
      ctx.tweens.add(1.8, (k) => rig.group.position.set(from.x + (x - from.x) * k, 0, from.z + (z - from.z) * k), { ease: ease.out });
    }
    batter.group.visible = true;
  };
  const dyn: Dyn = {
    id: p.id ?? 'team', object: g, at: () => ({ x: p.x, y: 1.5, z: p.z - 9 }), states: () => (isSet ? ['set'] : []),
    setState(s, instant) { if (s === 'set' && !isSet) { isSet = true; place(instant); if (!instant) { ctx.audio.sfx('cheer'); ctx.say('Nine players jog onto the field in your lineup. Batting order: by the numbers you found.'); } } },
    update(dt) { t += dt; for (const r of rigs.values()) r.update(dt, 'idle', 0); batter.update(dt, 'idle', 0); runner.update(dt, 'idle', 0); },
    /** Play a simulated game. `plays` come from logic/baseballSim. Resolves when the last play is done. */
    run(name, arg) {
      if (name !== 'sim' || busy) return Promise.resolve();
      busy = true;
      const plays = (arg as { plays: Play[]; onPlay?: (p: Play) => void; speed?: number }).plays;
      const onPlay = (arg as { onPlay?: (p: Play) => void }).onPlay;
      const speed = (arg as { speed?: number }).speed ?? 1;
      if (!isSet) { isSet = true; place(true); }
      return new Promise<void>((resolve) => {
        let i = 0;
        const next = () => {
          const pl = plays[i++];
          if (!pl) { ball.visible = false; runner.group.visible = false; marks.forEach((m) => (m.visible = false)); busy = false; resolve(); return; }
          onPlay?.(pl);
          if (pl.half === 'them') { ctx.tweens.after(0.05, next); return; } // the opponent's half is summarised by the caller
          const dur = (ctx.reduced ? 0.01 : 1.5) / speed;
          // pitch
          ball.visible = true; ball.position.set(0, 1.6, POS.P![1]);
          batter.play('interact');
          ctx.audio.sfx('whoosh');
          ctx.tweens.add(0.45 * dur / 1.5 + 0.0001, (k) => ball.position.set(0, 1.6 - 0.6 * k, POS.P![1] * (1 - k) + 0.3 * k), { ease: ease.linear, done: () => {
            const hit = ['single', 'double', 'homerun', 'groundout', 'flyout', 'error'].includes(pl.type);
            if (!hit) { ctx.audio.sfx('click'); ball.visible = false; marks.forEach((m, bi) => (m.visible = pl.bases[bi]! >= 0)); ctx.tweens.after(0.5 * dur / 1.5, next); return; }
            ctx.audio.sfx('crack'); ctx.fx.burst('dust', p.x, 1, p.z, 10, 0.5);
            // where the ball goes
            const dest: [number, number, number] = pl.type === 'homerun' ? [(pl.batter % 3 - 1) * 14, 4, -FENCE_R - 6] : pl.type === 'double' ? [(pl.batter % 2 ? 20 : -20), 0, -30] : pl.type === 'flyout' ? [((pl.batter + 1) % 3 - 1) * 14, 0, -28] : pl.type === 'single' || pl.type === 'error' ? [((pl.batter + 2) % 3 - 1) * 10, 0, -20] : [((pl.batter + 2) % 3 - 1) * 6, 0, -12];
            const arc = pl.type === 'groundout' || pl.type === 'single' ? 1.5 : pl.type === 'homerun' ? 18 : pl.type === 'double' ? 6 : 12;
            ctx.tweens.add(1.1 * dur / 1.5 + 0.0001, (k) => ball.position.set(dest[0] * k, 0.4 + Math.sin(k * Math.PI) * arc + (dest[1] * k), dest[2] * k), { ease: ease.linear, done: () => {
              if (pl.type === 'homerun') { ctx.audio.sfx('cheer'); ctx.fx.burst('confetti', p.x + dest[0], 6, p.z + dest[2] + 4, 40); }
              ball.visible = pl.type === 'single' || pl.type === 'error' || pl.type === 'double';
              marks.forEach((m, bi) => (m.visible = pl.bases[bi]! >= 0));
              ctx.tweens.after(0.6 * dur / 1.5, () => { ball.visible = false; next(); });
            } });
            // a fielder chases it
            const f = [...rigs.values()][(pl.batter + 3) % 9]!;
            const fx = f.group.position.x, fz = f.group.position.z;
            ctx.tweens.add(1.0 * dur / 1.5 + 0.0001, (k) => f.group.position.set(fx + (dest[0] * 0.8 - fx) * k, 0, fz + (dest[2] * 0.8 - fz) * k), { ease: ease.out, done: () => ctx.tweens.add(0.8, (k) => f.group.position.set(dest[0] * 0.8 + (fx - dest[0] * 0.8) * k, 0, dest[2] * 0.8 + (fz - dest[2] * 0.8) * k)) });
          } });
        };
        next();
      });
    },
  };
  return { object: g, dyn };
};

void sign; void mat; void col; void (null as unknown as BuildCtx);
export const ballparkBuilders: Record<string, Builder> = { diamond, fence, stands, dugout, lightTower, plate, team };
