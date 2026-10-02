/**
 * THE POWER GRID of a place: how much of it is working. Every glowing thing (emissive materials, lit signs and screens, the coloured lamps and
 * the general light) answers one number per district, 0 = offline (dark displays, dim lamps, a beautiful place waiting) to 1 = alive. The number
 * comes from the player's real work (logic/restoration.ts, never stored here) or, for a cinematic, from an override (the opening's "everything
 * worked" shots, the finale's surge). Materials are shared across the game, so a scene gets private clones of the glowing ones; they are
 * released with the scene. No gameplay reads this: it only paints.
 */
import { type Color, type HemisphereLight, type AmbientLight, type DirectionalLight, type Material, type Mesh, MeshBasicMaterial, type MeshStandardMaterial, type Object3D, type PointLight } from 'three';

interface Group { emis: { m: MeshStandardMaterial; base: number; tint: Color }[]; basics: { m: MeshBasicMaterial; base: Color; surface: boolean }[] }

const smooth = (u: number) => u * u * (3 - 2 * u);
/** What an offline place keeps of each kind of light: visible and moody, never black. */
export const GLOW_OFF = 0.04, SIGN_OFF = 0.08, LAMP_OFF = 0.1, GENERAL_OFF = 0.3, SURFACE_OFF = 0.34;

export class PowerGrid {
  private groups = new Map<string, Group>();
  private cache = new Map<string, MeshStandardMaterial>();
  private seenBasic = new Set<Material>();
  private lampGroup: string[] = [];
  private base = { hemi: 1, amb: 0, sun: 1, lamps: [] as number[] };
  /** The district whose number the scene's own lights follow ('' = the scene's default). */
  private shown = new Map<string, number>();

  constructor(private hemi: HemisphereLight, private amb: AmbientLight, private sun: DirectionalLight, private lamps: PointLight[]) {}

  /** The place this grid belongs to goes on stage: its authored light levels are what 1 means. (Materials were registered when it was built, possibly frames ago.) */
  activate(hemi: number, amb: number, sun: number, lampGroups: string[]): void {
    this.shown.clear();
    this.base = { hemi, amb, sun, lamps: this.lamps.map((l) => l.intensity) };
    this.lampGroup = lampGroups;
  }

  /** Make the glowing parts of a built prop answer to `group` (a district name, '' for the scene's default). */
  register(obj: Object3D, group: string): void {
    const g = this.groups.get(group) ?? { emis: [], basics: [] }; this.groups.set(group, g);
    obj.traverse((o) => {
      const m = o as Mesh; if (!m.isMesh || Array.isArray(m.material)) return;
      const mt = m.material as MeshStandardMaterial & MeshBasicMaterial;
      if (mt.isMeshStandardMaterial && mt.emissiveIntensity > 0.05 && mt.emissive.getHex() !== 0) {
        const key = `${group}|${mt.uuid}`; let c = this.cache.get(key);
        if (!c) { c = mt.clone() as MeshStandardMaterial; c.userData = { ...c.userData, shared: false }; this.cache.set(key, c); g.emis.push({ m: c, base: mt.emissiveIntensity, tint: mt.color.clone() }); }
        m.material = c;
      } else if (mt.isMeshBasicMaterial && mt.map && !mt.userData.shared && !this.seenBasic.has(mt)) {
        this.seenBasic.add(mt); g.basics.push({ m: mt, base: mt.color.clone(), surface: mt.toneMapped !== false });
      }
    });
  }

  /** A flat-lit surface that is not a prop (the ground): it darkens with the place. */
  addBasic(m: MeshBasicMaterial, group = ''): void { const g = this.groups.get(group) ?? { emis: [], basics: [] }; this.groups.set(group, g); if (!this.seenBasic.has(m)) { this.seenBasic.add(m); g.basics.push({ m, base: m.color.clone(), surface: true }); } }

  /** The districts this scene has something to light for. */
  keys(): string[] { return [...new Set([...this.groups.keys(), ...this.lampGroup, ''])]; }
  /** How alive a district is right now (0..1), for things that animate (the plaza core's turning speed). */
  level(group: string): number { return this.shown.get(group) ?? this.shown.get('') ?? 1; }

  /** Show the levels (0..1 per district). Cheap: touches only the glowing materials and the lights. */
  paint(levels: ReadonlyMap<string, number>): number {
    for (const [k, v] of levels) this.shown.set(k, v);
    for (const [name, g] of this.groups) {
      const u = this.level(name), glow = GLOW_OFF + (1 - GLOW_OFF) * Math.pow(u, 1.3), sign = SIGN_OFF + (1 - SIGN_OFF) * u;
      for (const e of g.emis) { e.m.emissiveIntensity = e.base * glow; e.m.color.copy(e.tint).multiplyScalar(0.3 + 0.7 * u); }
      for (const b of g.basics) b.m.color.copy(b.base).multiplyScalar(b.surface ? SURFACE_OFF + (1 - SURFACE_OFF) * u : sign);
    }
    const u0 = this.level('');
    const general = GENERAL_OFF + (1 - GENERAL_OFF) * smooth(u0);
    this.hemi.intensity = this.base.hemi * general; this.amb.intensity = this.base.amb * general; this.sun.intensity = this.base.sun * general;
    this.lamps.forEach((l, i) => { const u = this.level(this.lampGroup[i] ?? ''); l.intensity = (this.base.lamps[i] ?? 0) * (LAMP_OFF + (1 - LAMP_OFF) * smooth(u)); });
    return u0;
  }
}
