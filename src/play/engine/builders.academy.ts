/**
 * Lanternhollow Academy props (an ORIGINAL school of "lantern-craft": runes are HTML, wards are CSS, incantations are JavaScript).
 * Stone, lantern light and violet magic; nothing here borrows from any existing franchise.
 */
import { Group, Mesh } from 'three';
import { ease } from './tween';
import { mat, shape, sign } from './kit';
import { col, num, str, flag, type Builder, type Dyn } from './builders';

const STONE = 0x8d8aa8, DARK = 0x3a3552, WOOD = 0x7a4f2b, LAMP = 0xffd98a, VIOLET = 0xb48cff, TEAL = 0x5ee6d0;

const tower: Builder = (p) => {
  const g = new Group(); const r = num(p, 'w', 3), h = num(p, 'h', 9);
  g.add(shape('cyl', r, h, r, STONE), shape('cone', r * 1.25, h * 0.4, r * 1.25, col(p, 'roof', 0x5a3f8c), { y: h }), shape('cyl', r * 1.08, 0.3, r * 1.08, DARK, { y: h - 0.3 }));
  for (let i = 0; i < 3; i++) g.add(shape('box', 0.4, 0.8, 0.12, LAMP, { x: Math.sin(i * 2.1) * r * 0.5, z: Math.cos(i * 2.1) * r * 0.5, y: 2.5 + i * 2.2, glow: 1, ry: -i * 2.1 }));
  return { object: g };
};

/** A lantern on a post. `lit:false` starts dark; state `light` (from code) lights it. */
const lantern: Builder = (p, ctx) => {
  const g = new Group(); const h = num(p, 'h', 2.4);
  g.add(shape('cyl', 0.1, h, 0.1, DARK), shape('box', 0.5, 0.06, 0.5, DARK, { y: h }), shape('box', 0.46, 0.06, 0.46, DARK, { y: h + 0.62 }), shape('cone', 0.5, 0.22, 0.5, DARK, { y: h + 0.68 }));
  const glass = shape('box', 0.36, 0.56, 0.36, 0x23202e, { y: h + 0.06, transparent: 0.28, cast: false }); g.add(glass);
  let lit = flag(p, 'lit', true);
  const flame = shape('sphere', 0.26, 0.3, 0.26, lit ? LAMP : 0x3a3645, { y: h + 0.14, glow: lit ? 1.3 : 0 });
  g.add(flame);
  const set = (on: boolean) => { lit = on; flame.material = mat(on ? LAMP : 0x3a3645, on ? 1.3 : 0); glass.material = mat(on ? LAMP : 0x23202e, on ? 0.5 : 0, { transparent: 0.3 }); };
  set(lit);
  let t = Math.random() * 6;
  const dyn: Dyn = {
    id: p.id ?? 'lantern', object: g, at: () => ({ x: p.x, y: h, z: p.z }), states: () => (lit ? ['lit'] : []),
    setState(s, instant) { if (s === 'light' || s === 'toggle') { const was = lit; set(true); if (!instant && !was) { ctx.audio.sfx('spell'); ctx.fx.burst('magic', p.x, h + 0.3, p.z, 10, 0.6); ctx.fx.flash(p.x, h + 0.3, p.z, LAMP, 5, 0.5); } } },
    update(dt) { t += dt; if (lit) flame.scale.y = 0.3 + Math.sin(t * 7) * 0.02; },
  };
  return { object: g, dyn };
};

/** A lectern with a floating book: where an incantation is written (the terminal of this world). */
const lectern: Builder = (p) => {
  const g = new Group(); const c = col(p, 'color', VIOLET);
  g.add(shape('box', 1.2, 0.95, 0.8, WOOD), shape('box', 1.3, 0.1, 0.9, 0x5a3c20, { y: 0.95 }));
  const book = new Group(); book.position.y = 1.35; g.add(book);
  book.add(shape('box', 0.7, 0.06, 0.5, 0xeee2c0, { y: 0, rx: -0.3 }), shape('box', 0.05, 0.08, 0.5, c, { y: 0, x: 0, rx: -0.3, glow: 0.9 }));
  g.add(sign(str(p, 'text', '').split('|'), 1.0, 0.4, { bg: '#241a3a', fg: `#${c.toString(16).padStart(6, '0')}`, y: 0.55, z: 0.42 }));
  let t = 0;
  return { object: g, dyn: { id: p.id ?? 'lectern', object: g, at: () => ({ x: p.x, y: 1.4, z: p.z }), setState() { /* always ready */ }, update(dt) { t += dt; book.position.y = 1.35 + Math.sin(t * 1.6 + p.x) * 0.06; book.rotation.y = Math.sin(t * 0.7) * 0.25; } } };
};

/** A banner that unfurls when the crest rune is written (`unfurl`). */
const banner: Builder = (p, ctx) => {
  const g = new Group(); const w = num(p, 'w', 2), h = num(p, 'h', 3);
  g.add(shape('cyl', w + 0.3, 0.12, 0.12, 0x5a3c20, { y: h, rz: Math.PI / 2 }));
  const cloth = new Group(); cloth.position.y = h; g.add(cloth);
  const body = shape('box', w, h, 0.05, col(p, 'color', 0x5a3f8c), { y: -h }); cloth.add(body);
  cloth.add(sign(str(p, 'text', '🏮').split('|'), w * 0.8, w * 0.8, { bg: '#5a3f8c', fg: '#ffd98a', y: -h * 0.55, z: 0.04 }));
  let k = 0.05; cloth.scale.y = k;
  const apply = (v: number) => { k = v; cloth.scale.y = Math.max(0.05, v); };
  return { object: g, dyn: { id: p.id ?? 'banner', object: g, at: () => ({ x: p.x, y: h / 2, z: p.z }), states: () => (k > 0.9 ? ['unfurl'] : []), setState(s, instant) { if (s !== 'unfurl' || k > 0.9) return; if (instant) apply(1); else { ctx.audio.sfx('whoosh'); ctx.tweens.add(1.1, apply, { ease: ease.out }); } } } };
};

/** A stone arch that becomes a portal: state `frame` raises the stones, `open` fills it with light. */
const portal: Builder = (p, ctx) => {
  const g = new Group(); const w = num(p, 'w', 3), h = num(p, 'h', 3.6);
  const frame = new Group(); g.add(frame);
  frame.add(shape('box', 0.5, h, 0.6, STONE, { x: -w / 2 }), shape('box', 0.5, h, 0.6, STONE, { x: w / 2 }), shape('box', w + 1, 0.55, 0.6, STONE, { y: h }), shape('cone', 0.6, 0.8, 0.6, VIOLET, { y: h + 0.55, glow: 0.8 }));
  const disc = shape('cyl', w - 0.2, 0.06, w - 0.2, col(p, 'color', VIOLET), { glow: 1.1, transparent: 0.6, rx: Math.PI / 2, y: h * 0.45 }); disc.visible = false; disc.scale.set(w - 0.2, 0.06, h - 0.3); g.add(disc);
  let raised = 0, open = false, t = 0;
  const setFrame = (k: number) => { raised = k; frame.position.y = -(1 - k) * (h + 1); frame.visible = k > 0.02; };
  setFrame(flag(p, 'up', false) ? 1 : 0);
  const dyn: Dyn = {
    id: p.id ?? 'portal', object: g, at: () => ({ x: p.x, y: h / 2, z: p.z }), states: () => [raised > 0.9 ? 'frame' : '', open ? 'open' : ''].filter(Boolean),
    setState(s, instant) {
      if (s === 'frame' && raised < 0.9) { if (instant) setFrame(1); else { ctx.audio.sfx('open'); ctx.fx.burst('dust', p.x, 0.3, p.z, 18); ctx.tweens.add(1.6, setFrame, { ease: ease.out }); } }
      if (s === 'open' && !open) { open = true; setFrame(1); disc.visible = true; if (!instant) { ctx.audio.sfx('spell'); ctx.fx.burst('magic', p.x, h / 2, p.z, 30, 1.2); ctx.fx.flash(p.x, h / 2, p.z + 1, VIOLET, 10, 0.8); } }
    },
    play(name) { if (name === 'malfunction') { ctx.audio.sfx('fail'); ctx.fx.burst('smoke', p.x, h / 2, p.z + 0.5, 14); ctx.fx.burst('sparks', p.x, h * 0.6, p.z + 0.5, 16); ctx.fx.flash(p.x, h / 2, p.z + 1, 0xff4d6d, 9, 0.6); } },
    update(dt) { if (open) { t += dt; disc.rotation.z += dt * 0.8; disc.scale.x = disc.scale.z = 1; disc.material = mat(col(p, 'color', VIOLET), 0.8 + Math.sin(t * 3) * 0.3, { transparent: 0.6 }); } },
  };
  return { object: g, dyn };
};

/** Floating runes: scattered until `align` (a row) or `grid` (a grid) - what flexbox and grid do to a page. */
const runes: Builder = (p, ctx) => {
  const g = new Group(); const n = num(p, 'n', 6);
  const glyphs: Mesh[] = [];
  const scatter: [number, number, number][] = []; const row: [number, number, number][] = []; const grid: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const m = shape('box', 0.5, 0.5, 0.12, [VIOLET, TEAL, 0xffd98a][i % 3]!, { glow: 0.8 }); g.add(m); glyphs.push(m);
    scatter.push([Math.sin(i * 2.7) * 1.8, 1 + (i % 3) * 0.6, Math.cos(i * 1.9) * 0.9]);
    row.push([(i - (n - 1) / 2) * 0.9, 1.6, 0]);
    grid.push([((i % 3) - 1) * 0.9, 2.2 - Math.floor(i / 3) * 0.9, 0]);
  }
  let mode: 'scatter' | 'row' | 'grid' = 'scatter', t = 0;
  const target = (i: number) => (mode === 'row' ? row[i]! : mode === 'grid' ? grid[i]! : scatter[i]!);
  glyphs.forEach((m, i) => m.position.set(...scatter[i]!));
  const apply = (next: 'row' | 'grid', instant: boolean) => { mode = next; if (instant || ctx.reduced) glyphs.forEach((m, i) => m.position.set(...target(i))); else { ctx.audio.sfx('spell'); ctx.tweens.add(1.2, (k) => glyphs.forEach((m, i) => { const a = m.userData.from ?? scatter[i]; const b = target(i); m.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k); }), { ease: ease.inOut }); glyphs.forEach((m) => { m.userData.from = [m.position.x, m.position.y, m.position.z]; }); } };
  return { object: g, dyn: { id: p.id ?? 'runes', object: g, at: () => ({ x: p.x, y: 1.6, z: p.z }), states: () => (mode === 'scatter' ? [] : [mode]), setState(s, instant) { if (s === 'align') apply('row', instant); if (s === 'grid') apply('grid', instant); }, update(dt) { t += dt; glyphs.forEach((m, i) => { m.rotation.y = Math.sin(t + i) * 0.3; m.position.y += Math.sin(t * 2 + i) * 0.0015; }); } } };
};

/** The ward dome: a translucent shell whose colour, thickness and size come from CSS-like spells. */
const dome: Builder = (p, ctx) => {
  const g = new Group(); const r = num(p, 'r', 7);
  const shell = shape('sphere', r * 2, r * 2, r * 2, VIOLET, { transparent: 0.0, cast: false, glow: 0.6 }); shell.position.y = 0; g.add(shell);
  let vis = 0, color = VIOLET, scale = 0.8;
  const paint = () => { shell.visible = vis > 0.01; shell.material = mat(color, 0.6, { transparent: Math.min(0.32, vis * 0.32) }); shell.scale.setScalar(r * 2 * scale); };
  paint();
  const dyn: Dyn = {
    id: p.id ?? 'dome', object: g, at: () => ({ x: p.x, y: 1.5, z: p.z }), states: () => [vis > 0 ? 'color' : '', vis > 0.5 ? 'thick' : '', scale > 0.95 ? 'adapt' : '', color === TEAL ? 'aegis' : ''].filter(Boolean),
    setState(s, instant) {
      const go = (fn: (k: number) => void) => (instant ? fn(1) : ctx.tweens.add(1.2, fn, { ease: ease.out }));
      if (s === 'color') { go((k) => { vis = k * 0.5; paint(); }); if (!instant) ctx.audio.sfx('spell'); }
      if (s === 'thick') go((k) => { vis = 0.5 + k * 0.5; paint(); });
      if (s === 'adapt') go((k) => { scale = 0.8 + k * 0.2; paint(); });
      if (s === 'aegis') { color = TEAL; go((k) => { vis = 1; scale = 1; paint(); void k; }); if (!instant) { ctx.audio.sfx('success'); ctx.fx.burst('shield', p.x, 2, p.z, 40, 2); } }
    },
  };
  dyn.play = (name) => { if (name !== 'malfunction') return; ctx.audio.sfx('fail'); ctx.fx.burst('sparks', p.x, 3, p.z, 30, 2); ctx.fx.flash(p.x, 3, p.z, 0xff4d6d, 12, 0.7); const keep = vis; ctx.tweens.add(0.6, (k) => { vis = keep * (0.3 + 0.7 * Math.abs(Math.sin(k * 14))); paint(); }, { done: () => { vis = keep; paint(); } }); };
  return { object: g, dyn };
};

/** The orb on the arena altar: sparks when the first incantation runs. */
const orb: Builder = (p, ctx) => {
  const g = new Group();
  g.add(shape('cyl', 0.9, 0.9, 0.9, DARK), shape('cyl', 1.0, 0.12, 1.0, STONE, { y: 0.9 }));
  const ball = shape('sphere', 0.5, 0.5, 0.5, 0x5b5675, { y: 1.3 }); g.add(ball);
  let t = 0, charge = 0;
  const set = (v: number) => { charge = v; ball.material = mat(v > 0 ? VIOLET : 0x5b5675, v); };
  return { object: g, dyn: { id: p.id ?? 'orb', object: g, at: () => ({ x: p.x, y: 1.6, z: p.z }), states: () => (charge > 0 ? ['spark'] : []), setState(s, instant) { if (s === 'spark' && charge === 0) { set(1.2); if (!instant) { ctx.audio.sfx('spell'); ctx.fx.burst('magic', p.x, 1.6, p.z, 26, 1); ctx.fx.flash(p.x, 1.8, p.z, VIOLET, 9, 0.6); } } }, update(dt) { t += dt; if (charge > 0) { ball.position.y = 1.3 + Math.sin(t * 2) * 0.08; } } } };
};

/** The oracle well: a spirit that answers when the API summoning works. */
const well: Builder = (p, ctx) => {
  const g = new Group();
  g.add(shape('cyl', 2.2, 0.9, 2.2, STONE), shape('cyl', 1.7, 0.92, 1.7, 0x23304a, { glow: 0.2 }), shape('box', 0.15, 2.2, 0.15, WOOD, { x: -1.0 }), shape('box', 0.15, 2.2, 0.15, WOOD, { x: 1.0 }), shape('box', 2.4, 0.15, 0.3, WOOD, { y: 2.2 }));
  const spirit = shape('sphere', 0.55, 0.7, 0.55, TEAL, { y: 1.4, glow: 1, transparent: 0.75 }); spirit.visible = false; g.add(spirit);
  const speech = sign(str(p, 'says', 'ASK ME').split('|'), 2.2, 0.8, { bg: '#0b2a2a', fg: '#5ee6d0', y: 2.6, z: 0 }); speech.visible = false; g.add(speech);
  let on = false, t = 0;
  return { object: g, dyn: { id: p.id ?? 'well', object: g, at: () => ({ x: p.x, y: 1.5, z: p.z }), states: () => (on ? ['answer'] : []), setState(s, instant) { if (s === 'answer' && !on) { on = true; spirit.visible = true; speech.visible = true; if (!instant) { ctx.audio.sfx('spell'); ctx.fx.burst('magic', p.x, 1.4, p.z, 30, 1.2); } } }, update(dt) { t += dt; if (on) { spirit.position.y = 1.2 + Math.sin(t * 2) * 0.15; speech.lookAt?.(0, 2.6, 30); } } } };
};

/** The Gloomhound: a shadow creature the student duels. Each spell that lands weakens it; a failed spell lets it strike. */
const hound: Builder = (p, ctx) => {
  const g = new Group(); const body = new Group(); g.add(body);
  const dark = 0x2a2438;
  body.add(shape('sphere', 1.5, 1.0, 2.2, dark, { y: 0.6 }), shape('sphere', 0.9, 0.8, 0.9, dark, { y: 1.0, z: 1.3 }), shape('cone', 0.25, 0.5, 0.25, dark, { x: -0.25, y: 1.7, z: 1.2 }), shape('cone', 0.25, 0.5, 0.25, dark, { x: 0.25, y: 1.7, z: 1.2 }));
  const eyeL = shape('sphere', 0.14, 0.14, 0.14, 0xff4d6d, { x: -0.22, y: 1.25, z: 1.7, glow: 1.4 }), eyeR = shape('sphere', 0.14, 0.14, 0.14, 0xff4d6d, { x: 0.22, y: 1.25, z: 1.7, glow: 1.4 });
  body.add(eyeL, eyeR);
  for (const [x, z] of [[-0.5, 0.7], [0.5, 0.7], [-0.5, -0.7], [0.5, -0.7]] as const) body.add(shape('cyl', 0.28, 0.6, 0.28, dark, { x, z }));
  body.add(shape('cone', 0.4, 1.2, 0.4, dark, { y: 0.9, z: -1.4, rx: -1.3 }));
  let hits = 0, defeated = false, atk = 0, t = 0;
  const look = () => { const k = Math.max(0.35, 1 - hits * 0.14); body.scale.setScalar(defeated ? 0.01 : k); };
  const dyn: Dyn = {
    id: p.id ?? 'hound', object: g, at: () => ({ x: p.x, y: 1, z: p.z }), states: () => [...(hits ? [`hit${hits}`] : []), ...(defeated ? ['defeat'] : [])],
    setState(s, instant) {
      const m = /^hit(\d)$/.exec(s);
      if (m) { const n = Number(m[1]); if (n > hits) { hits = n; if (!instant) { ctx.audio.sfx('hit'); ctx.fx.burst('sparks', p.x, 1.2, p.z + 1, 24); ctx.fx.flash(p.x, 1.4, p.z + 1.2, VIOLET, 9, 0.5); ctx.fx.burst('magic', p.x, 1.2, p.z + 1, 20, 1); } look(); } }
      if (s === 'defeat' && !defeated) { defeated = true; if (instant) look(); else { ctx.audio.sfx('cheer'); ctx.fx.burst('magic', p.x, 1.2, p.z, 60, 1.6); ctx.fx.burst('confetti', p.x, 2, p.z, 40); ctx.tweens.add(1.4, (k) => body.scale.setScalar(Math.max(0.01, 1 - k)), { ease: ease.inOut }); } }
    },
    play(name) { if (name === 'malfunction' && !defeated) { atk = 1; ctx.audio.sfx('hit'); ctx.fx.burst('smoke', p.x, 1, p.z + 2, 14); ctx.fx.flash(p.x, 1.2, p.z + 2.5, 0xff4d6d, 10, 0.5); } },
    update(dt) { t += dt; if (defeated) return; body.position.y = Math.sin(t * 2) * 0.05; if (atk > 0) { atk = Math.max(0, atk - dt * 1.8); body.position.z = Math.sin(atk * Math.PI) * 1.8; } eyeL.scale.setScalar(0.14 + Math.sin(t * 5) * 0.02); },
  };
  look();
  return { object: g, dyn };
};

/** The duelist's ward-shield: a dome around the lectern, raised by an error-handling spell; a failed spell cracks it (and the crack mends itself). */
const shield: Builder = (p, ctx) => {
  const g = new Group(); const r = num(p, 'r', 3);
  const bubble = shape('sphere', r * 2, r * 2, r * 2, TEAL, { transparent: 0.0, cast: false, glow: 0.5 }); bubble.visible = false; g.add(bubble);
  let up = false, crack = 0, t = 0;
  const paint = () => { bubble.visible = up; bubble.material = mat(crack > 0 ? 0xff4d6d : TEAL, 0.5 + crack, { transparent: 0.16 + crack * 0.2 }); };
  return { object: g, dyn: { id: p.id ?? 'shield', object: g, at: () => ({ x: p.x, y: 1.5, z: p.z }), states: () => (up ? ['raise'] : []),
    setState(s, instant) { if (s === 'raise' && !up) { up = true; paint(); if (!instant) { ctx.audio.sfx('spell'); ctx.fx.burst('shield', p.x, 1.6, p.z, 40, 1.6); ctx.fx.flash(p.x, 1.6, p.z, TEAL, 8, 0.6); } } },
    play(name) { if (name === 'malfunction' && up) { crack = 1; paint(); ctx.audio.sfx('crack'); ctx.fx.burst('sparks', p.x, 1.6, p.z, 20, 1.4); } },
    update(dt) { t += dt; if (crack > 0) { crack = Math.max(0, crack - dt * 0.6); paint(); } if (up) bubble.rotation.y = t * 0.3; } } };
};

const castleWall: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 6), h = num(p, 'h', 4);
  g.add(shape('box', w, h, 0.8, STONE));
  for (let x = -w / 2 + 0.4; x < w / 2; x += 1.2) g.add(shape('box', 0.7, 0.6, 0.85, STONE, { x, y: h }));
  return { object: g };
};
const bookshelf: Builder = (p) => {
  const g = new Group(); const w = num(p, 'w', 3);
  g.add(shape('box', w, 2.6, 0.5, WOOD));
  for (let r = 0; r < 4; r++) for (let i = 0; i < Math.floor(w / 0.3); i++) g.add(shape('box', 0.22, 0.4, 0.3, [0x7a3f5c, 0x3f6a7a, 0x8a7a3a, 0x5a3f8c][(i + r) % 4]!, { x: -w / 2 + 0.25 + i * 0.3, y: 0.15 + r * 0.6, z: 0.14 }));
  return { object: g };
};
const desk: Builder = (p) => { const g = new Group(); g.add(shape('box', num(p, 'w', 1.6), 0.1, 0.8, WOOD, { y: 0.8 }), shape('box', 0.1, 0.8, 0.7, 0x5a3c20, { x: -0.7 }), shape('box', 0.1, 0.8, 0.7, 0x5a3c20, { x: 0.7 }), shape('box', 0.5, 0.05, 0.35, 0xeee2c0, { y: 0.9, rz: 0.05 })); return { object: g }; };
const pond: Builder = (p) => ({ object: shape('cyl', num(p, 'w', 6), 0.06, num(p, 'w', 6), 0x3a6ea8, { glow: 0.25, y: 0.01, transparent: 0.85, cast: false }) });
const hedge: Builder = (p) => ({ object: shape('box', num(p, 'w', 4), num(p, 'h', 1.3), num(p, 'd', 0.9), 0x2f7a4d) });
const statue: Builder = () => { const g = new Group(); g.add(shape('box', 1.2, 0.8, 1.2, STONE), shape('cyl', 0.7, 1.6, 0.5, 0x9a97b8, { y: 0.8 }), shape('sphere', 0.55, 0.55, 0.55, 0x9a97b8, { y: 2.4 }), shape('sphere', 0.22, 0.22, 0.22, LAMP, { y: 3.0, glow: 1 })); return { object: g }; };
const crystal: Builder = (p) => { const g = new Group(); const h = num(p, 'h', 1.6); g.add(shape('cone', 0.7, h, 0.7, col(p, 'color', VIOLET), { glow: 0.9, transparent: 0.85 }), shape('cone', 0.45, h * 0.7, 0.45, col(p, 'color', VIOLET), { x: 0.5, z: 0.2, glow: 0.9, transparent: 0.85 })); return { object: g }; };
const glowtree: Builder = (p) => { const g = new Group(); const s = num(p, 'scale', 1); g.add(shape('cyl', 0.4 * s, 2 * s, 0.4 * s, 0x5a4a6a), shape('sphere', 2.6 * s, 2.2 * s, 2.6 * s, 0x3c8f6a, { y: 1.8 * s }), shape('sphere', 0.22, 0.22, 0.22, LAMP, { x: 0.8 * s, y: 2.6 * s, z: 0.6 * s, glow: 1.2 }), shape('sphere', 0.22, 0.22, 0.22, TEAL, { x: -0.9 * s, y: 3.2 * s, z: 0.2 * s, glow: 1.2 })); return { object: g }; };

export const academyBuilders: Record<string, Builder> = { shield, tower, lantern, lectern, banner, portal, runes, dome, orb, well, hound, castleWall, bookshelf, desk, pond, hedge, statue, crystal, glowtree };
