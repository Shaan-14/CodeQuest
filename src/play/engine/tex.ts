/**
 * PROCEDURAL TEXTURES: floors, wall panels, grates, hazard stripes and emblems drawn once on a canvas and cached. No image files to download,
 * every colour comes from the scene's own palette, and everything is released with `clearTextures()` when the player leaves 3D.
 */
import { CanvasTexture, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from 'three';

const cache = new Map<string, CanvasTexture>();
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const shade = (n: number, k: number) => { const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))); return (f(r) << 16) | (f(g) << 8) | f(b); };

function make(key: string, size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, repeat = true): CanvasTexture {
  let t = cache.get(key); if (t) return t;
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; t.minFilter = LinearMipmapLinearFilter;
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
  t.userData.shared = true; cache.set(key, t); return t;
}
const speckle = (g: CanvasRenderingContext2D, s: number, n: number, light = 'rgba(255,255,255,.05)', dark = 'rgba(0,0,0,.07)') => {
  let seed = 12345; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < n; i++) { g.fillStyle = rnd() < 0.5 ? light : dark; g.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 1 + rnd() * 2); }
};

/** Polished industrial floor: 2×2 panels with bevelled grout and faint wear. One texture tile = 2 panels per side. */
export function metalTiles(a: number, b: number): CanvasTexture {
  return make(`mt${a}|${b}`, 256, (g, s) => {
    g.fillStyle = hex(a); g.fillRect(0, 0, s, s);
    const h = s / 2;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      g.fillStyle = hex((i + j) % 2 ? shade(a, 1.07) : shade(b, 1.0)); g.fillRect(i * h + 3, j * h + 3, h - 6, h - 6);
      const gr = g.createLinearGradient(i * h, j * h, i * h + h, j * h + h); gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.14)');
      g.fillStyle = gr; g.fillRect(i * h + 3, j * h + 3, h - 6, h - 6);
      g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = 1; g.strokeRect(i * h + 4.5, j * h + 4.5, h - 9, h - 9);
    }
    g.fillStyle = hex(shade(a, 0.55)); g.fillRect(0, 0, s, 3); g.fillRect(0, h - 1, s, 2); g.fillRect(0, 0, 3, s); g.fillRect(h - 1, 0, 2, s);
    speckle(g, s, 700);
  });
}

/** Wall panels with seams, rivets and a darker skirting at the bottom (v = 0). */
export function wallPanel(color: number, accent: number): CanvasTexture {
  return make(`wp${color}|${accent}`, 256, (g, s) => {
    g.fillStyle = hex(color); g.fillRect(0, 0, s, s);
    const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(0.55, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.28)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(s / 2 - 1, 0, 2, s); g.fillRect(0, 0, 2, s);
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(s / 2 + 1, 0, 1, s);
    for (const [x, y] of [[10, 12], [s / 2 - 10, 12], [s / 2 + 10, 12], [s - 10, 12], [10, s - 40], [s / 2 - 10, s - 40], [s / 2 + 10, s - 40], [s - 10, s - 40]] as const) { g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(x - 0.8, y - 0.8, 1.4, 0, 7); g.fill(); }
    g.fillStyle = hex(shade(color, 0.7)); g.fillRect(0, s - 34, s, 34);          // skirting
    g.fillStyle = hex(accent); g.fillRect(0, s - 36, s, 3);                      // accent line above it
    speckle(g, s, 500);
  });
}

/** A ventilation grate / drain plate. */
export function grate(base: number): CanvasTexture {
  return make(`gr${base}`, 128, (g, s) => { g.fillStyle = hex(shade(base, 0.55)); g.fillRect(0, 0, s, s); g.fillStyle = hex(shade(base, 1.15)); for (let i = 0; i < 8; i++) g.fillRect(4, 6 + i * 15, s - 8, 6); });
}

/** Warning stripes (diagonal), for floors and edges. */
export function hazard(a: number, b: number): CanvasTexture {
  return make(`hz${a}|${b}`, 128, (g, s) => { g.fillStyle = hex(b); g.fillRect(0, 0, s, s); g.fillStyle = hex(a); for (let i = -2; i < 6; i++) { g.beginPath(); g.moveTo(i * 32, s); g.lineTo(i * 32 + 16, s); g.lineTo(i * 32 + 16 + s, 0); g.lineTo(i * 32 + s, 0); g.fill(); } speckle(g, s, 200); });
}

/** A round emblem for the floor (gear + rings + a word). Not repeating. */
export function emblem(label: string, color: number, bg: number): CanvasTexture {
  return make(`em${label}|${color}|${bg}`, 512, (g, s) => {
    g.clearRect(0, 0, s, s);
    const c = s / 2;
    g.fillStyle = hex(bg); g.globalAlpha = 0.55; g.beginPath(); g.arc(c, c, c - 8, 0, 7); g.fill(); g.globalAlpha = 1;
    g.strokeStyle = hex(color); g.lineWidth = 8; g.beginPath(); g.arc(c, c, c - 12, 0, 7); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(c, c, c - 60, 0, 7); g.stroke();
    g.fillStyle = hex(color);
    for (let i = 0; i < 16; i++) { g.save(); g.translate(c, c); g.rotate((i / 16) * Math.PI * 2); g.fillRect(-14, -(c - 128), 28, 40); g.restore(); }
    g.lineWidth = 10; g.beginPath(); g.arc(c, c, c - 150, 0, 7); g.stroke();
    g.fillStyle = hex(shade(bg, 0.6)); g.globalAlpha = 0.8; g.beginPath(); g.arc(c, c, c - 160, 0, 7); g.fill(); g.globalAlpha = 1;
    g.fillStyle = hex(color); g.font = '700 46px ui-monospace, Menlo, Consolas, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    label.split('|').forEach((t, i, a) => g.fillText(t, c, c + (i - (a.length - 1) / 2) * 52, s - 280));
  }, false);
}

/** Free every cached texture (called when the 3D layer is torn down). */
export function clearTextures(): void { for (const t of cache.values()) t.dispose(); cache.clear(); }
