/**
 * THE STAGE: the three.js host of one playable place at a time. It builds a scene from data, runs the player, NPCs and animated props, and
 * reports what happens (a prompt to show, an interaction, a caption) through callbacks. It owns NO game rules: the learning engine, quests and
 * save are reached only through the `env` it is given, so the 3D layer cannot fork progress.
 *
 * Performance rules: one draw of shared geometry per prop, pixel ratio capped by quality, real shadows only on "high", the loop stops when a
 * terminal/dialogue covers the view or the tab is hidden, and every scene's GPU resources are released when the player leaves it.
 */
import {
  BackSide, BufferAttribute, SphereGeometry, type Object3D, AmbientLight, Box3, Ray, Color, DirectionalLight, Fog, Group, HemisphereLight, Mesh, MeshBasicMaterial, OctahedronGeometry, PCFShadowMap, PerspectiveCamera, PlaneGeometry, Scene, Vector3, WebGLRenderer,
} from 'three';
import type { SaveData } from '../../core/save';
import type { GameEvent } from '../../game/events';
import { hasEffect, holds } from '../logic/conditions';
import type { Npc3D } from '../logic/dialogue';
import { nearestInteractable } from '../logic/interact';
import { markersFor, type Marker } from '../logic/markers';
import { collidersOf, newBody, poseOf, stepBody, type Body } from '../logic/movement';
import type { Collider, Interactable, SceneDef } from '../logic/sceneTypes';
import type { QuestObjective } from '../../content/schema';
import { Audio } from './audio';
import { builders, type BuildCtx, type Dyn } from './builders';
import { Fx } from './fx';
import { Input } from './input';
import { createRig, type Rig } from './rig';
import { Tweens } from './tween';
import { clearLabels, mat } from './kit';

export type Quality = 'low' | 'medium' | 'high';

/** What the stage needs from the outside world. */
export interface StageEnv {
  getSave(): SaveData;
  getNpc(id: string): Npc3D | undefined;
  /** Which station (terminal) a quest objective is worked at. */
  stationMatches(station: string, o: QuestObjective): boolean;
  /** The station a lesson belongs to (so a failed attempt can make the right thing react). */
  stationOfChallenge(challengeId: string): string | undefined;
  onPrompt(it: Interactable | null): void;
  onInteract(it: Interactable): void;
  onCaption(text: string): void;
  onPause(): void;
  onPosition(scene: string, x: number, z: number, ry: number): void;
  onAction?(name: string): void;
  playerLook: { body: number; head: number; accent: number; hair?: number };
  quality: Quality;
  reducedMotion: boolean;
}

interface NpcRuntime { npc: Npc3D; rig: Rig; x: number; z: number; ry: number; home: { x: number; z: number }; patrol?: { x: number; z: number }[]; leg: number; collider: Collider & { kind: 'circle' }; speed: number }

/** Props that are flat or fixed to walls: they never block the view, so they are never hidden. */
const NEVER_HIDE = new Set(['wall', 'floor', 'ground', 'pond', 'sign', 'screen', 'statusScreen', 'banner', 'void']);
/** Wall-mounted things: hidden when the camera is behind them AND outside the room (like the wall itself), so they never fill the screen. */
const MOUNTED = new Set(['sign', 'screen', 'statusScreen', 'banner']);
const markerGeo = new OctahedronGeometry(0.22);
markerGeo.userData.shared = true;

export class Stage {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(48, 1, 0.1, 160);
  readonly input: Input;
  readonly tweens = new Tweens();
  readonly audio = new Audio();
  readonly fx: Fx;
  def: SceneDef | null = null;
  body: Body = newBody(0, 0);
  private playerRig: Rig;
  private world = new Group();
  private dyns = new Map<string, Dyn>();
  private npcs: NpcRuntime[] = [];
  private colliders: Collider[] = [];
  /** Solid props that can open (a gate): their collider leaves when the prop opens. */
  private propColliders = new Map<string, Collider>();
  /** Room walls: hidden while the camera is on the outside of them, so the room is never seen from behind a wall. */
  /** Tall solid props: hidden while they stand between the camera and the player, so nothing ever hides the character. */
  private occluders: { obj: Object3D; box: Box3 }[] = [];
  private ray = new Ray(); private hit = new Vector3(); private headPos = new Vector3();
  private mounted: { obj: Object3D; nx: number; nz: number; px: number; pz: number }[] = [];
  private walls: { obj: Object3D; nx: number; nz: number; px: number; pz: number; inside: number }[] = [];
  private active: Interactable[] = [];
  private markers: Marker[] = [];
  private markerMeshes = new Map<string, Mesh>();
  private prompt: Interactable | null = null;
  private yaw = 0; private pitch = 0.55; private dist = 8;
  /** A fixed broadcast view (a simulated game, a cutscene): the camera orbits this point instead of the player. */
  private cinema: { x: number; y: number; z: number; yaw: number; pitch: number; dist: number } | null = null;
  private camPos = new Vector3(); private camLook = new Vector3();
  private raf = 0; private last = 0; private running = false; private t = 0;
  private stepClock = 0; private posClock = 0; private shake = 0;
  private sky: Mesh;
  private hemi: HemisphereLight; private sun: DirectionalLight; private amb: AmbientLight;
  private onResize: () => void;
  private resizeObs: ResizeObserver | null = null;
  private ctx: BuildCtx;
  /** Speed-up for automated tests only (set through the e2e-only hook). */
  timeScale = 1;
  /** Extra per-frame hooks from scene modes (a car, a simulation). */
  hooks: ((dt: number, t: number) => void)[] = [];
  /** When set, the player body is driven by something else (a vehicle) and normal walking is off. */
  driver: ((dt: number, input: Input) => void) | null = null;
  reduced: boolean;
  /** Drive mode (racing): the camera follows this heading (null = normal). */
  private chase: number | null = null;
  get colliderList(): Collider[] { return this.colliders; }
  get worldGroup(): Group { return this.world; }
  setPlayerVisible(v: boolean): void { this.playerRig.group.visible = v; }
  setChase(heading: number | null): void { this.chase = heading; }
  /** Put the player on foot at a place (leaving a car). */
  placePlayer(x: number, z: number, ry: number): void { this.body.x = x; this.body.z = z; this.body.vx = 0; this.body.vz = 0; this.body.ry = ry; this.playerRig.group.position.set(x, 0, z); this.playerRig.group.rotation.y = ry; }
  get buildCtx(): BuildCtx { return this.ctx; }
  get sceneBounds(): SceneDef['bounds'] | undefined { return this.def?.bounds; }
  /** Show a caption from outside the stage (a simulated game narrates itself). */
  env_caption?: (text: string) => void;

  constructor(canvas: HTMLCanvasElement, private host: HTMLElement, private env: StageEnv) {
    this.reduced = env.reducedMotion;
    this.env_caption = (t) => env.onCaption(t);
    this.renderer = new WebGLRenderer({ canvas, antialias: env.quality !== 'low', powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, env.quality === 'high' ? 2 : env.quality === 'medium' ? 1.5 : 1));
    this.renderer.shadowMap.enabled = env.quality === 'high';
    this.renderer.shadowMap.type = PCFShadowMap;
    this.hemi = new HemisphereLight(0xbcd2ff, 0x3a3f58, 0.9);
    this.amb = new AmbientLight(0xffffff, 0.25);
    this.sun = new DirectionalLight(0xffffff, 1.1);
    this.sun.castShadow = env.quality === 'high';
    this.sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.hemi, this.amb, this.sun, this.sun.target, this.world);
    // a gradient sky dome (zenith colour above, horizon colour below) that follows the camera: there is always a sky to look at
    const skyGeo = new SphereGeometry(120, 18, 12); skyGeo.setAttribute('color', new BufferAttribute(new Float32Array(skyGeo.getAttribute('position').count * 3), 3));
    this.sky = new Mesh(skyGeo, new MeshBasicMaterial({ vertexColors: true, side: BackSide, fog: false, depthWrite: false }));
    this.sky.renderOrder = -10; this.sky.frustumCulled = false; this.scene.add(this.sky);
    this.fx = new Fx(this.scene);
    this.fx.density = env.reducedMotion ? 0.35 : env.quality === 'low' ? 0.5 : 1;
    this.tweens.instant = env.reducedMotion;
    this.input = new Input(host);
    this.playerRig = createRig({ ...env.playerLook, hat: 'none' });
    this.scene.add(this.playerRig.group);
    this.ctx = { fx: this.fx, tweens: this.tweens, audio: this.audio, say: (t) => env.onCaption(t), reduced: this.reduced, mood: (k) => this.setMood(k), cinema: (v) => this.setCinema(v) };
    this.onResize = () => this.resize();
    if (typeof ResizeObserver !== 'undefined') { this.resizeObs = new ResizeObserver(this.onResize); this.resizeObs.observe(host); }
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.resize();
  }

  private onVisibility = () => { if (document.hidden) this.pause(); else if (this.wantRun) this.start(); };
  private wantRun = false;

  resize(): void {
    const w = Math.max(2, this.host.clientWidth), h = Math.max(2, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  /* ------------------------------------------------------------------ scenes */

  /** Build a scene from data and put the player at a spawn (or a saved position). */
  load(def: SceneDef, at?: { x: number; z: number; ry: number } | string): void {
    this.unload();
    this.def = def;
    const look = def.look;
    this.scene.background = new Color(look.sky);
    this.scene.fog = new Fog(look.fog, look.fogNear ?? 28, look.fogFar ?? 75);
    this.paintSky(new Color(look.sky).multiplyScalar(look.night ? 0.7 : 1.15), new Color(look.fog));
    this.hemi.color.setHex(look.sky === 0 ? 0x88aaff : 0xbcd2ff); this.hemi.groundColor.setHex(look.ground);
    this.hemi.intensity = look.night ? 0.55 : 0.95; this.amb.intensity = look.ambient ?? 0.25;
    this.sun.intensity = look.sun ?? (look.night ? 0.45 : 1.1);
    const sd = look.sunDir ?? [0.5, 1, 0.4]; this.sun.position.set(sd[0] * 30, sd[1] * 30, sd[2] * 30);
    const b = def.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    if (this.sun.castShadow) { const s = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) * 0.6; const sc = this.sun.shadow.camera; sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.updateProjectionMatrix(); this.sun.target.position.set(cx, 0, cz); }
    // ground
    const ground = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: look.ground }));
    ground.rotation.x = -Math.PI / 2; ground.scale.set(b.maxX - b.minX + 120, b.maxZ - b.minZ + 120, 1); ground.position.set(cx, 0, cz);
    this.world.add(ground);
    // props
    const save = this.env.getSave();
    for (const p of def.props) {
      const make = builders[p.kind];
      if (!make) { console.warn('unknown prop kind', p.kind); continue; }
      const built = make(p, this.ctx);
      // offset (not overwrite): a builder may return a mesh that is already lifted by half its height
      built.object.position.x += p.x; built.object.position.y += p.y ?? 0; built.object.position.z += p.z;
      built.object.rotation.y = p.ry ?? 0;
      this.world.add(built.object);
      if (built.dyn && p.id) this.dyns.set(p.id, built.dyn);
      if (!NEVER_HIDE.has(p.kind)) { const box = new Box3().setFromObject(built.object); if (box.max.y - box.min.y > 0.7) this.occluders.push({ obj: built.object, box }); }
      if (MOUNTED.has(p.kind)) { const ry = p.ry ?? 0; this.mounted.push({ obj: built.object, nx: Math.sin(ry), nz: Math.cos(ry), px: p.x, pz: p.z }); }
      if (p.kind === 'wall') { const ry = p.ry ?? 0; const n = { x: Math.sin(ry), z: Math.cos(ry) }; const inside = Math.sign(n.x * (cx - p.x) + n.z * (cz - p.z)) || 1; this.walls.push({ obj: built.object, nx: n.x, nz: n.z, px: p.x, pz: p.z, inside }); }
    }
    this.colliders = collidersOf({ ...def, props: def.props.filter((p) => !p.id) });
    this.propColliders.clear();
    // a solid prop with an id remembers its collider so it can be removed when the prop opens
    for (const p of def.props) if (p.id && p.solid) { const c = collidersOf({ ...def, props: [p], walls: [] })[0]; if (c) { this.colliders.push(c); this.propColliders.set(p.id, c); } }
    // NPCs
    for (const pl of def.npcs) {
      const npc = this.env.getNpc(pl.npc); if (!npc) continue;
      const rig = createRig(npc.look);
      rig.group.position.set(pl.x, 0, pl.z); rig.group.rotation.y = pl.ry ?? 0;
      this.scene.add(rig.group);
      const collider = { kind: 'circle' as const, x: pl.x, z: pl.z, r: 0.5 };
      this.colliders.push(collider);
      this.npcs.push({ npc, rig, x: pl.x, z: pl.z, ry: pl.ry ?? 0, home: { x: pl.x, z: pl.z }, patrol: pl.patrol, leg: 0, collider, speed: 0 });
    }
    // where the player stands
    const spawn = typeof at === 'string' ? def.spawns[at] : at;
    const s0 = spawn ?? def.spawns.default ?? Object.values(def.spawns)[0] ?? { x: 0, z: 0, ry: 0 };
    this.body = newBody(s0.x, s0.z, s0.ry);
    this.yaw = s0.ry; this.pitch = 0.55;
    this.snapCamera();
    this.playerRig.group.position.set(s0.x, 0, s0.z);
    // state the player's code has already earned: instant, no animation
    for (const r of def.reactions ?? []) if (hasEffect(save, r.effect)) { this.dyns.get(r.prop)?.setState(r.state, true); if (r.state === 'open') this.openGate(r.prop); }
    this.refresh();
    this.audio.setAmbience(def.ambience ?? 'none');
    this.env.onCaption(`${def.title}. ${def.blurb}`);
  }

  private unload(): void {
    this.tweens.clear();
    for (const o of [...this.world.children]) this.world.remove(o);
    const dispose = (o: Mesh) => {
      const m = o.material as MeshBasicMaterial | undefined;
      if (m && !m.userData.shared) { (m.map && !m.map.userData.shared) && m.map.dispose(); m.dispose(); }
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    };
    this.world.traverse((c) => { if ((c as Mesh).isMesh) dispose(c as Mesh); });
    clearLabels();
    for (const n of this.npcs) this.scene.remove(n.rig.group);
    this.npcs = []; this.dyns.clear(); this.colliders = []; this.active = []; this.markers = []; this.walls = []; this.occluders = []; this.mounted = [];
    for (const m of this.markerMeshes.values()) this.scene.remove(m);
    this.markerMeshes.clear();
    this.prompt = null; this.driver = null; this.hooks = []; this.chase = null; this.playerRig.group.visible = true; this.audio.engine(null); this.cinema = null;
  }

  /** The save changed: which interactables exist now, which things to mark, and what the world shows. Cheap; call after every action. */
  refresh(): void {
    const def = this.def; if (!def) return;
    const save = this.env.getSave();
    const all: Interactable[] = [...def.interactables, ...def.exits.map((e): Interactable => ({ id: `exit:${e.id}`, verb: 'Enter', label: e.label, x: e.x, z: e.z, range: 1.9, action: { type: 'exit', to: e.to, spawn: e.spawn } }))];
    this.active = all.filter((i) => holds(save, i.when));
    this.markers = markersFor(save, def, this.active, this.env.getNpc, this.env.stationMatches);
    const want = new Set(this.markers.map((m) => m.id));
    for (const [id, mesh] of this.markerMeshes) if (!want.has(id)) { this.scene.remove(mesh); this.markerMeshes.delete(id); }
    for (const m of this.markers) {
      let mesh = this.markerMeshes.get(m.id);
      if (!mesh) { mesh = new Mesh(markerGeo, mat(m.kind === 'offer' ? 0xffd166 : 0x4fd1ff, 1.2)); this.scene.add(mesh); this.markerMeshes.set(m.id, mesh); }
      mesh.material = mat(m.kind === 'offer' ? 0xffd166 : 0x4fd1ff, 1.2);
      mesh.position.set(m.x, m.kind === 'offer' ? 2.5 : 2.2, m.z);
    }
  }

  /* ------------------------------------------------------------------ reacting to the game */

  /** Something happened in the learning engine. Show it in the world. */
  react(events: readonly GameEvent[]): void {
    const def = this.def; if (!def) return;
    let won = false, lost = false;
    for (const e of events) {
      if (e.type === 'worldEffect') {
        const ref = `${e.target}:${e.action}`;
        for (const r of def.reactions ?? []) if (r.effect === ref) { this.dyns.get(r.prop)?.setState(r.state, false); if (r.state === 'open') this.openGate(r.prop); if (r.say) this.env.onCaption(r.say); won = true; }
      } else if (e.type === 'challengeFailed') {
        const station = this.env.stationOfChallenge(e.challengeId);
        for (const c of def.consequences ?? []) if (c.station === station) { this.dyns.get(c.prop)?.play?.('malfunction'); this.env.onCaption(c.say); lost = true; }
      } else if (e.type === 'questComplete') { this.audio.sfx('quest'); won = true; }
      else if (e.type === 'questAccepted') this.audio.sfx('quest');
    }
    if (won) { this.playerRig.play('success'); this.fx.burst('confetti', this.body.x, 2, this.body.z, 26); this.audio.sfx('success'); }
    if (lost) { this.playerRig.play('damage'); this.playerRig.flash(true); this.tweens.after(0.35, () => this.playerRig.flash(false)); if (!this.reduced) this.shake = 0.5; }
    this.refresh();
  }

  private openGate(prop: string): void { const c = this.propColliders.get(prop); if (c) { this.colliders = this.colliders.filter((x) => x !== c); this.propColliders.delete(prop); } }

  /** Paint the sky dome: `zenith` at the top blending to `horizon` at eye level. */
  private paintSky(zenith: Color, horizon: Color): void {
    const geo = this.sky.geometry, pos = geo.getAttribute('position'), col = geo.getAttribute('color') as BufferAttribute; const c = new Color();
    for (let i = 0; i < pos.count; i++) { const k = Math.max(0, Math.min(1, pos.getY(i) / 100)); c.copy(horizon).lerp(zenith, Math.pow(k, 0.7)); col.setXYZ(i, c.r, c.g, c.b); }
    col.needsUpdate = true;
  }

  /** Blend the light of the place toward dawn (0..1). Used by the Summit finale: the outage ends and the sky brightens. */
  setMood(k: number): void {
    const look = this.def?.look; if (!look) return;
    this.paintSky(new Color(look.sky).lerp(new Color(0x5a8fd8), k * 0.8), new Color(look.fog).lerp(new Color(0xffc58a), k));
    const mix = (a: number, b: number) => new Color(a).lerp(new Color(b), k);
    (this.scene.background as Color).copy(mix(look.sky, 0xffc58a));
    if (this.scene.fog) (this.scene.fog as Fog).color.copy(mix(look.fog, 0xffd9b0));
    this.hemi.intensity = (look.night ? 0.55 : 0.95) + k * 0.6; this.sun.intensity = (look.sun ?? 1) * (1 + k * 0.9);
    this.sun.color.copy(mix(0xffffff, 0xffc27a));
  }

  /** Play an animation on the player (the UI asks: cast, interact, success...). */
  playerAnim(a: Parameters<Rig['play']>[0]): void { this.playerRig.play(a); }
  dyn(id: string): Dyn | undefined { return this.dyns.get(id); }
  npcRig(id: string): Rig | undefined { return this.npcs.find((n) => n.npc.id === id)?.rig; }

  /* ------------------------------------------------------------------ loop */

  start(): void {
    this.wantRun = true;
    if (this.running || document.hidden) return;
    this.running = true; this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - this.last) / 1000) * this.timeScale; this.last = now; // capped, but high enough that a slow machine slows the picture, not the walking speed
      this.frame(dt);
    };
    this.raf = requestAnimationFrame(tick);
  }
  pause(): void { this.running = false; cancelAnimationFrame(this.raf); this.input.clear(); }
  /** Stop for good reason (terminal open): stops rendering entirely until `start()`. */
  suspend(): void { this.wantRun = false; this.pause(); }
  setInputEnabled(on: boolean): void { this.input.enabled = on; if (!on) this.input.clear(); }

  private snapCamera(): void {
    this.updateCamera(0, true);
  }

  /** Take the camera to a fixed viewpoint (null returns it to the player). */
  setCinema(v: { x: number; y?: number; z: number; yaw: number; pitch: number; dist: number } | null): void { this.cinema = v ? { y: 1, ...v } : null; }

  private updateCamera(dt: number, snap = false): void {
    const b = this.cinema ? { x: this.cinema.x, z: this.cinema.z, y: 0 } : this.body;
    const yaw = this.cinema?.yaw ?? this.yaw, pitch = this.cinema?.pitch ?? this.pitch, dist = this.cinema?.dist ?? this.dist;
    const cy = this.cinema ? this.cinema.y : 1.5 + b.y * 0.6;
    // The camera stays inside the room: if the orbit would leave it, the camera comes closer (and higher) instead of looking at a wall from outside.
    const bd = this.def?.bounds;
    let flat = Math.cos(pitch) * dist;
    const dirX = Math.sin(yaw), dirZ = Math.cos(yaw);
    if (bd) {
      const m = -9; // the camera may go well outside the room: the walls in the way disappear
      const lim = (d: number, p: number, lo: number, hi: number) => (d > 1e-4 ? (hi - m - p) / d : d < -1e-4 ? (lo + m - p) / d : Infinity);
      flat = Math.max(1.2, Math.min(flat, lim(dirX, b.x, bd.minX, bd.maxX), lim(dirZ, b.z, bd.minZ, bd.maxZ)));
    }
    const ex = b.x + dirX * flat;
    const ey = cy + Math.max(Math.sin(pitch) * dist, (dist * Math.cos(pitch) - flat) * 0.9 + Math.sin(pitch) * flat);
    const ez = b.z + dirZ * flat;
    const k = snap ? 1 : Math.min(1, dt * 7);
    this.camPos.x += (ex - this.camPos.x) * k; this.camPos.y += (ey - this.camPos.y) * k; this.camPos.z += (ez - this.camPos.z) * k;
    this.camLook.x += (b.x - this.camLook.x) * k; this.camLook.y += (cy - this.camLook.y) * k; this.camLook.z += (b.z - this.camLook.z) * k;
    this.camera.position.copy(this.camPos);
    this.sky.position.copy(this.camPos);
    for (const w of this.walls) w.obj.visible = (w.nx * (this.camPos.x - w.px) + w.nz * (this.camPos.z - w.pz)) * w.inside > -0.5;
    const bd2 = this.def?.bounds;
    const outside = !!bd2 && (this.camPos.x < bd2.minX || this.camPos.x > bd2.maxX || this.camPos.z < bd2.minZ || this.camPos.z > bd2.maxZ);
    for (const m of this.mounted) m.obj.visible = !(outside && (m.nx * (this.camPos.x - m.px) + m.nz * (this.camPos.z - m.pz)) < -0.5);
    // things standing between the camera and the character vanish until they no longer do
    if (this.occluders.length) {
      this.headPos.set(b.x, cy - 0.2, b.z);
      this.ray.origin.copy(this.camera.position); this.ray.direction.copy(this.headPos).sub(this.ray.origin);
      const len = this.ray.direction.length(); this.ray.direction.divideScalar(len || 1);
      for (const o of this.occluders) { const h = this.ray.intersectBox(o.box, this.hit); o.obj.visible = !(h && h.distanceTo(this.ray.origin) < len - 0.4); }
    }
    if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt * 2); this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.3; this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.3; }
    this.camera.lookAt(this.camLook);
  }

  private frame(dt: number): void {
    this.t += dt;
    const inp = this.input;
    if (inp.wasPressed('Escape')) this.env.onPause();
    if (inp.wasPressed('m')) this.env.onAction?.('map');
    if (inp.wasPressed('j')) this.env.onAction?.('journal');
    // camera: mouse drag, wheel, Q/R keys (for players without a mouse)
    this.yaw -= inp.dragX; this.pitch = Math.max(0.12, Math.min(1.2, this.pitch + inp.dragY));
    if (inp.isDown('q')) this.yaw += dt * 1.8;
    if (inp.isDown('r')) this.yaw -= dt * 1.8;
    if (inp.wheel) this.dist = Math.max(3.5, Math.min(12, this.dist + inp.wheel * 0.8));

    if (this.driver) this.driver(dt, inp);
    else this.walk(dt);

    // NPCs: patrol, and watch the player when close
    for (const n of this.npcs) this.updateNpc(n, dt);
    for (const d of this.dyns.values()) d.update?.(dt, this.t);
    for (const h of this.hooks) h(dt, this.t);
    this.tweens.update(dt);
    this.fx.update(dt);
    // markers bob
    for (const [id, m] of this.markerMeshes) { m.rotation.y += dt * 2; const base = this.markers.find((x) => x.id === id); if (base) m.position.y = (base.kind === 'offer' ? 2.5 : 2.2) + Math.sin(this.t * 3) * 0.08; }

    // interaction prompt
    if (!this.driver) {
      const it = nearestInteractable(this.body.x, this.body.z, this.body.ry, this.active);
      if (it?.id !== this.prompt?.id) { this.prompt = it; this.env.onPrompt(it); }
      if (it && inp.wasPressed('e', 'f')) { this.audio.resume(); this.audio.sfx('interact'); this.playerRig.play('interact'); this.env.onInteract(it); }
    }
    // remember where we stand (rate-limited; silent)
    this.posClock += dt;
    if (this.posClock > 3 && this.def) { this.posClock = 0; this.env.onPosition(this.def.id, this.body.x, this.body.z, this.body.ry); }

    if (this.chase !== null) { let d = this.chase - this.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; this.yaw += d * Math.min(1, dt * 2.6); this.pitch += (0.32 - this.pitch) * Math.min(1, dt * 2); this.dist += (9.5 - this.dist) * Math.min(1, dt * 2); }
    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
    inp.endFrame();
  }

  private walk(dt: number): void {
    const inp = this.input, b = this.body, def = this.def;
    if (!def) return;
    if (inp.isDown('w', 'ArrowUp', 's', 'ArrowDown', 'a', 'ArrowLeft', 'd', 'ArrowRight', ' ', 'Shift')) this.audio.resume();
    const f = (inp.isDown('w', 'ArrowUp') ? 1 : 0) - (inp.isDown('s', 'ArrowDown') ? 1 : 0);
    const r = (inp.isDown('d', 'ArrowRight') ? 1 : 0) - (inp.isDown('a', 'ArrowLeft') ? 1 : 0);
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw); // away from the camera
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const run = inp.isDown('Shift');
    const wasAir = !b.onGround;
    stepBody(b, { dx: fx * f + rx * r, dz: fz * f + rz * r, run, jump: inp.isDown(' ') }, this.colliders, def.bounds, dt);
    if (wasAir && b.onGround) this.audio.sfx('step');
    const speed = Math.hypot(b.vx, b.vz);
    const pose = poseOf(b, run);
    this.playerRig.update(dt, pose, speed);
    if (speed > 0.6 && b.onGround) { this.stepClock += dt * (run ? 4 : 3); if (this.stepClock > 1) { this.stepClock = 0; this.audio.sfx('step'); } }
    if (!wasAir && !b.onGround) this.audio.sfx('jump');
    const g = this.playerRig.group; g.position.set(b.x, b.y, b.z); g.rotation.y = b.ry;
  }

  private updateNpc(n: NpcRuntime, dt: number): void {
    const dx = this.body.x - n.x, dz = this.body.z - n.z, d = Math.hypot(dx, dz);
    let moving = false;
    if (n.patrol && n.patrol.length > 1 && d > 4) {
      const tgt = n.patrol[n.leg % n.patrol.length]!;
      const tx = tgt.x - n.x, tz = tgt.z - n.z, td = Math.hypot(tx, tz);
      if (td < 0.2) n.leg++;
      else { n.x += (tx / td) * dt * 1.0; n.z += (tz / td) * dt * 1.0; n.ry = Math.atan2(-tx, -tz); moving = true; }
    } else if (d < 5) {
      const target = Math.atan2(-dx, -dz); let df = target - n.ry;
      while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI;
      n.ry += df * Math.min(1, dt * 3);
    }
    n.collider.x = n.x; n.collider.z = n.z;
    n.rig.group.position.set(n.x, 0, n.z); n.rig.group.rotation.y = n.ry;
    n.rig.update(dt, moving ? 'walk' : 'idle', moving ? 1 : 0);
    if (d < 6) n.rig.lookAt(this.body.x, this.body.z);
  }

  /* ------------------------------------------------------------------ test and debug surface (read-only state; teleport only for e2e) */

  snapshot(): { scene: string | null; x: number; z: number; ry: number; y: number; prompt: string | null; npcs: { id: string; x: number; z: number }[]; markers: string[]; fps: number } {
    return { scene: this.def?.id ?? null, x: this.body.x, z: this.body.z, ry: this.body.ry, y: this.body.y, prompt: this.prompt?.id ?? null, npcs: this.npcs.map((n) => ({ id: n.npc.id, x: n.x, z: n.z })), markers: this.markers.map((m) => m.id), fps: 0 };
  }
  teleport(x: number, z: number, ry?: number): void { this.body.x = x; this.body.z = z; this.body.vx = 0; this.body.vz = 0; if (ry !== undefined) { this.body.ry = ry; this.yaw = ry; } this.snapCamera(); }
  /** Renderer statistics for the performance report. */
  stats(): { calls: number; triangles: number; geometries: number; textures: number } { const i = this.renderer.info; return { calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures }; }

  dispose(): void {
    this.suspend();
    this.unload();
    this.scene.remove(this.sky); this.sky.geometry.dispose(); (this.sky.material as MeshBasicMaterial).dispose();
    this.fx.dispose(); this.audio.dispose(); this.input.dispose();
    this.resizeObs?.disconnect(); window.removeEventListener('resize', this.onResize); document.removeEventListener('visibilitychange', this.onVisibility);
    this.renderer.dispose(); this.renderer.forceContextLoss();
  }
}
