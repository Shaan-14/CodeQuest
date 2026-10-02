/**
 * THE STAGE: the three.js host of one playable place at a time. It builds a scene from data, runs the player, NPCs and animated props, and
 * reports what happens (a prompt to show, an interaction, a caption) through callbacks. It owns NO game rules: the learning engine, quests and
 * save are reached only through the `env` it is given, so the 3D layer cannot fork progress.
 *
 * Performance rules: one draw of shared geometry per prop, pixel ratio capped by quality, real shadows only on "high", the loop stops when a
 * terminal/dialogue covers the view or the tab is hidden, and every scene's GPU resources are released when the player leaves it.
 */
import {
  ACESFilmicToneMapping, PMREMGenerator, PointLight, BackSide, BufferAttribute, SphereGeometry, type Material, type Object3D, AmbientLight, Box3, Ray, Color, DirectionalLight, Fog, Group, HemisphereLight, Mesh, MeshBasicMaterial, OctahedronGeometry, PCFShadowMap, PerspectiveCamera, PlaneGeometry, Scene, Vector3, WebGLRenderer,
} from 'three';
import type { SaveData } from '../../core/save';
import type { GameEvent } from '../../game/events';
import { hasEffect, holds } from '../logic/conditions';
import type { Npc3D, NpcLook } from '../logic/dialogue';
import { nearestInteractable } from '../logic/interact';
import { fitColliders } from './collide';
import { markersAt, type Marker } from '../logic/markers';
import { collidersOf, newBody, poseOf, pushOut, stepBody, type Body } from '../logic/movement';
import type { Collider, Interactable, Prop, SceneDef } from '../logic/sceneTypes';
import type { QuestObjective } from '../../content/schema';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Audio } from './audio';
import { builders, type BuildCtx, type Dyn } from './builders';
import { Fx } from './fx';
import { Input } from './input';
import { createRig, type OneShot, type Rig } from './rig';
import { Tweens } from './tween';
import { Director, type CineState } from './director';
import { Guide } from './guide';
import { batchStatic } from './batch';
import { buildGrid, findPath, pathLength, type PathGrid } from '../logic/path';
import type { Waypoint } from '../logic/objective';
import type { Cinematic, Target } from '../logic/cinematic';
import { clearLabels, mat } from './kit';

export type Quality = 'low' | 'medium' | 'high';

/** What the stage needs from the outside world. */
export interface StageEnv {
  getSave(): SaveData;
  /** Run a section of the replay lap for a cinematic (provided by the screen, which knows the player's setup). Returns a function that stops it. */
  lapSection?(from: number, to: number, done: (ms: number | null) => void): () => void;
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
  /** The cinematic layer's state (letterbox, subtitle, banner) for the UI. */
  onCinematic?(state: CineState): void;
  /** Where the objective is, from the player's point of view (distance in metres, bearing in radians relative to the camera, through-a-door flag). */
  onGuide?(g: { dist: number; bearing: number; via: boolean; label: string } | null): void;
  /** Which cinematic shows this event (a reaction id, a quest completion, a level up), or none. */
  cinematic?(ref: string): Cinematic | undefined;
  playerLook: NpcLook;
  quality: Quality;
  reducedMotion: boolean;
}

export interface NpcRuntime { npc: Npc3D; rig: Rig; x: number; z: number; ry: number; home: { x: number; z: number }; patrol?: { x: number; z: number }[]; leg: number; collider: Collider & { kind: 'circle' }; speed: number; /** A cinematic sends the NPC somewhere / turns it toward something. */ goal?: { x: number; z: number }; faceTarget?: { x: number; z: number }; activity?: OneShot; greeted?: boolean; idleIn?: number }

/** Props that are flat or fixed to walls: they never block the view, so they are never hidden. */
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
  readonly director: Director;
  private guide: Guide;
  private grid: PathGrid | null = null;
  private waypoint: Waypoint | null = null;
  private guideClock = 0; private pathClock = 0; private lastGuideX = 1e9; private lastGuideZ = 1e9;
  private controlLocked = false;
  playerGoal: { x: number; z: number } | null = null;
  playerFace: { x: number; z: number } | null = null;
  /** How fast the camera glides to where it wants to be (a cinematic sets this per shot). */
  camRate = 9;
  private propPos = new Map<string, { x: number; y: number; z: number }>();
  private world = new Group();
  private dyns = new Map<string, Dyn>();
  private ticks: ((dt: number, t: number) => void)[] = [];
  private npcs: NpcRuntime[] = [];
  private colliders: Collider[] = [];
  /** Every placed prop with its built object (the integrity check compares what is seen with what blocks). */
  readonly built: { p: Prop; obj: Object3D }[] = [];
  /** Solid props that can open (a gate): their collider leaves when the prop opens. */
  private propColliders = new Map<string, Collider[]>();
  private npcColliders = new Set<Collider>();
  /** Room walls: hidden while the camera is on the outside of them, so the room is never seen from behind a wall. */
  /** Tall solid props: hidden while they stand between the camera and the player, so nothing ever hides the character. */
  /** What the camera may not pass through: walls, tall furniture, buildings, the whole crown of a tree. */
  private camBlockers: Box3[] = [];
  private camK = 1;
  private crownBoxes: Box3[] = [];
  private rebuildBlockers(): void {
    this.camBlockers = [...this.crownBoxes, ...this.colliders.filter((c) => (c.top ?? 0) > 2.2 && c.h === undefined).map((c) => (c.kind === 'circle' ? new Box3(new Vector3(c.x - c.r, 0, c.z - c.r), new Vector3(c.x + c.r, c.top!, c.z + c.r)) : new Box3(new Vector3(c.x - c.w / 2, 0, c.z - c.d / 2), new Vector3(c.x + c.w / 2, c.top!, c.z + c.d / 2))))];
  }
  private ray = new Ray(); private hit = new Vector3();
  private mounted: { obj: Object3D; nx: number; nz: number; px: number; pz: number }[] = [];
  private walls: { obj: Object3D; nx: number; nz: number; px: number; pz: number; inside: number }[] = [];
  private active: Interactable[] = [];
  private markers: Marker[] = [];
  private markerMeshes = new Map<string, Mesh>();
  private prompt: Interactable | null = null;
  private yaw = 0; private pitch = 0.42; private dist = 7.4;
  /** A fixed broadcast view (a simulated game, a cutscene): the camera orbits this point instead of the player. */
  private cinema: { x: number; y: number; z: number; yaw: number; pitch: number; dist: number } | null = null;
  private camPos = new Vector3(); private camLook = new Vector3();
  private raf = 0; private last = 0; private running = false; private t = 0;
  private stepClock = 0; private posClock = 0; private shake = 0;
  private sky: Mesh;
  private lamps: PointLight[] = [];
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
  /** The player put something on or took it off: build the avatar again in the same place, facing the same way. */
  setPlayerLook(look: NpcLook): void {
    const old = this.playerRig, pos = old.group.position.clone(), vis = old.group.visible, face = old.facing();
    this.scene.remove(old.group);
    old.group.traverse((o) => { const m = o as Mesh; if (!m.isMesh) return; const mt = m.material as Material | undefined; if (mt && !mt.userData.shared) mt.dispose(); if (m.geometry && !m.geometry.userData.shared) m.geometry.dispose(); });
    this.playerRig = createRig(look);
    this.scene.add(this.playerRig.group);
    this.playerRig.group.position.copy(pos); this.playerRig.group.visible = vis; this.playerRig.setFacing(face, true);
  }
  setChase(heading: number | null): void { this.chase = heading; }
  /** Put the player on foot at a place (leaving a car). */
  placePlayer(x: number, z: number, ry: number): void { this.body.x = x; this.body.z = z; this.body.vx = 0; this.body.vz = 0; this.body.ry = ry; this.playerRig.group.position.set(x, 0, z); this.playerRig.setFacing(ry, true); }
  get buildCtx(): BuildCtx { return this.ctx; }
  get playerRigRef(): Rig { return this.playerRig; }
  /** Turn to a console and work at it (hands on the keys, head down), or step away. */
  useStation(on: boolean): void {
    if (!on) { this.playerRig.release(); return; }
    const it = this.prompt; if (it) { this.body.ry = Math.atan2(-(it.x - this.body.x), -(it.z - this.body.z)); this.playerRig.setFacing(this.body.ry); this.playerRig.lookAt(it.x, it.z); }
    this.playerRig.hold('type');
  }
  /** Frame a conversation: over the player's shoulder toward the speaker, who turns to the player and talks. */
  conversationShot(npcId: string): void {
    const n = this.npcRuntime(npcId); if (!n) return;
    const heading = Math.atan2(-(n.x - this.body.x), -(n.z - this.body.z));
    this.body.ry = heading; this.playerRig.setFacing(heading);
    n.faceTarget = { x: this.body.x, z: this.body.z }; n.rig.talk(true);
    this.camRate = 4.5;
    this.setCinema({ x: (this.body.x + n.x) / 2, z: (this.body.z + n.z) / 2, y: 1.45, yaw: heading + Math.PI + 0.62, pitch: 0.16, dist: Math.max(3.6, Math.hypot(n.x - this.body.x, n.z - this.body.z) + 2.4) });
  }
  endConversationShot(npcId: string): void {
    const n = this.npcRuntime(npcId); if (n) { n.faceTarget = undefined; n.rig.talk(false); n.rig.mood('neutral'); }
    if (!this.director.active) { this.setCinema(null); this.camRate = 9; }
  }
  /** Show the objective as a trail and a column of light (null hides them). */
  setWaypoint(w: Waypoint | null): void { this.waypoint = w; this.refresh(); this.guide.setTarget(w); this.guide.setPath(null); this.pathClock = 99; this.lastGuideX = 1e9; if (!w) this.env.onGuide?.(null); }
  setGuideVisible(on: boolean): void { this.guide.enabled = on; }
  /** NPC gestures toward a place for a moment ("it is through there"). */
  npcPoint(id: string, x: number, z: number, seconds = 3.2): void { const n = this.npcRuntime(id); if (!n) return; n.rig.pointAt(x, z); n.rig.hold('point'); n.faceTarget = { x, z }; this.tweens.after(seconds, () => { n.rig.release(); n.faceTarget = undefined; }); }
  get cameraYaw(): number { return this.yaw; }
  /** While a cinematic plays the player cannot walk or interact; the body stands still. */
  setControlLocked(on: boolean): void { this.controlLocked = on; if (on) { this.body.vx = 0; this.body.vz = 0; this.input.clear(); this.prompt = null; this.env.onPrompt(null); } else { this.playerGoal = null; this.playerFace = null; this.playerRig.lookAt(null); } }
  get locked(): boolean { return this.controlLocked; }
  shakeCamera(amount: number): void { this.shake = Math.max(this.shake, amount); }
  npcRuntime(id: string): NpcRuntime | undefined { return this.npcs.find((n) => n.npc.id === id); }
  /** Put an NPC at a place at once (a skipped cinematic ends with everyone where they should be). */
  placeNpc(id: string, x: number, z: number): void { const n = this.npcRuntime(id); if (!n) return; n.x = x; n.z = z; n.home = { x, z }; n.goal = undefined; n.collider.x = x; n.collider.z = z; n.rig.group.position.set(x, 0, z); }
  /** A cinematic is over: NPCs go back to watching the player and idling. */
  releaseNpcs(): void { for (const n of this.npcs) { n.faceTarget = undefined; if (n.goal) { n.x = n.goal.x; n.z = n.goal.z; n.home = { ...n.goal }; n.goal = undefined; } n.rig.release(); n.rig.talk(false); n.rig.mood('neutral'); n.rig.lookAt(null); } this.playerRig.release(); this.playerGoal = null; this.playerFace = null; }
  /** Where a cue target is in the world now. */
  targetPos(t: Target): { x: number; y: number; z: number } | null {
    if ('player' in t) return { x: this.body.x, y: 1.2 + this.body.y, z: this.body.z };
    if ('npc' in t) { const n = this.npcRuntime(t.npc); return n ? { x: n.x, y: 1.3, z: n.z } : null; }
    if ('prop' in t) { const d = this.dyns.get(t.prop); if (d) return d.at(); return this.propPos.get(t.prop) ?? null; }
    return { x: t.at[0], y: t.at[2] ?? 1, z: t.at[1] };
  }
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
    // filmic tone mapping and a soft studio environment (reflections on metal and glass) give the flat primitives depth and a cohesive look
    this.renderer.toneMapping = ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.0;
    const pmrem = new PMREMGenerator(this.renderer); this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; this.scene.environmentIntensity = 0.45; pmrem.dispose();
    this.hemi = new HemisphereLight(0xbcd2ff, 0x3a3f58, 0.9);
    this.amb = new AmbientLight(0xffffff, 0.25);
    this.sun = new DirectionalLight(0xffffff, 1.1);
    this.sun.castShadow = env.quality === 'high';
    this.sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.hemi, this.amb, this.sun, this.sun.target, this.world);
    for (let i = 0; i < 4; i++) { const l = new PointLight(0xffffff, 0, 14, 1.6); this.scene.add(l); this.lamps.push(l); }
    // a gradient sky dome (zenith colour above, horizon colour below) that follows the camera: there is always a sky to look at
    const skyGeo = new SphereGeometry(120, 18, 12); skyGeo.setAttribute('color', new BufferAttribute(new Float32Array(skyGeo.getAttribute('position').count * 3), 3));
    this.sky = new Mesh(skyGeo, new MeshBasicMaterial({ vertexColors: true, side: BackSide, fog: false, depthWrite: false, toneMapped: false }));
    this.sky.renderOrder = -10; this.sky.frustumCulled = false; this.scene.add(this.sky);
    this.fx = new Fx(this.scene);
    this.fx.density = env.reducedMotion ? 0.35 : env.quality === 'low' ? 0.5 : 1;
    this.tweens.instant = env.reducedMotion;
    this.input = new Input(host);
    this.playerRig = createRig(env.playerLook);
    this.scene.add(this.playerRig.group);
    this.director = new Director(this, (st) => env.onCinematic?.(st));
    this.guide = new Guide(this.scene);
    this.ctx = { fx: this.fx, tweens: this.tweens, audio: this.audio, say: (t) => env.onCaption(t), reduced: this.reduced, mood: (k) => this.setMood(k), cinema: (v) => this.setCinema(v), dyn: (id) => this.dyns.get(id), player: () => ({ x: this.body.x, z: this.body.z }) };
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
    const lampBudget = this.env.quality === 'low' ? 0 : this.env.quality === 'medium' ? 3 : 4; // coloured point lights are the costly part of the look: fewer on slower settings
    this.lamps.forEach((l, i) => { const d = i < lampBudget ? look.lights?.[i] : undefined; if (d) { l.position.set(d.x, d.y, d.z); l.color.setHex(d.color); l.intensity = d.intensity; l.distance = d.dist ?? 14; } else l.intensity = 0; });
    const b = def.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    if (this.sun.castShadow) { const s = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) * 0.6; const sc = this.sun.shadow.camera; sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.updateProjectionMatrix(); this.sun.target.position.set(cx, 0, cz); }
    // ground
    const ground = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: look.ground }));
    ground.rotation.x = -Math.PI / 2; ground.scale.set(b.maxX - b.minX + 120, b.maxZ - b.minZ + 120, 1); ground.position.set(cx, 0, cz);
    this.world.add(ground);
    // props
    const save = this.env.getSave();
    const fitted = new Map<Prop, Collider[]>(); const crowns: Box3[] = [];
    for (const p of def.props) {
      const make = builders[p.kind];
      if (!make) { console.warn('unknown prop kind', p.kind); continue; }
      const built = make(p, this.ctx);
      // offset (not overwrite): a builder may return a mesh that is already lifted by half its height
      built.object.position.x += p.x; built.object.position.y += p.y ?? 0; built.object.position.z += p.z;
      built.object.rotation.y = p.ry ?? 0;
      this.world.add(built.object);
      this.built.push({ p, obj: built.object });
      const fit = fitColliders(built.object, p); if (fit.length) fitted.set(p, fit); // before static batching merges the parts: what blocks follows what is drawn
      if (!built.dyn && !built.tick && p.kind !== 'floor') batchStatic(built.object);
      if (built.dyn && p.id) this.dyns.set(p.id, built.dyn);
      if (built.tick) this.ticks.push(built.tick);
      if (p.id) this.propPos.set(p.id, { x: p.x, y: (p.y ?? 0) + 1, z: p.z });
      if (p.kind === 'tree' || p.kind === 'glowtree') crowns.push(new Box3().setFromObject(built.object)); // the camera keeps out of a tree's whole crown, not just its trunk
      // a gate's lintel and canopy: the camera keeps out of the span, so it never ends up inside the entrance structure
      if (p.kind === 'gatehouse') { const b = new Box3().setFromObject(built.object); b.min.y = Math.max(0, Number(p.p?.h ?? 4.4) - 0.2); crowns.push(b); }
      if (MOUNTED.has(p.kind)) { const ry = p.ry ?? 0; this.mounted.push({ obj: built.object, nx: Math.sin(ry), nz: Math.cos(ry), px: p.x, pz: p.z }); }
      if (p.kind === 'wall') { const ry = p.ry ?? 0; const n = { x: Math.sin(ry), z: Math.cos(ry) }; const inside = Math.sign(n.x * (cx - p.x) + n.z * (cz - p.z)) || 1; this.walls.push({ obj: built.object, nx: n.x, nz: n.z, px: p.x, pz: p.z, inside }); }
    }
    this.grid = null; this.waypoint = null; this.guide.setTarget(null);
    this.colliders = [...(def.walls ?? [])];
    this.propColliders.clear();
    for (const p of def.props) {
      const own = fitted.get(p) ?? (p.solid ? collidersOf({ ...def, props: [p], walls: [] }).map((c) => ({ ...c, top: Number(p.p?.h ?? 3) })) : []); // the declared footprint only where nothing could be measured (a wall, a door)
      this.colliders.push(...own);
      // a solid prop with an id remembers its colliders so they can be removed when the prop opens
      if (p.id && own.length) this.propColliders.set(p.id, own);
    }
    this.crownBoxes = crowns; this.rebuildBlockers();
    // NPCs
    for (const pl of def.npcs) {
      const npc = this.env.getNpc(pl.npc); if (!npc) continue;
      const rig = createRig(npc.look);
      rig.group.position.set(pl.x, 0, pl.z); rig.setFacing(pl.ry ?? 0, true);
      this.scene.add(rig.group);
      const collider = { kind: 'circle' as const, x: pl.x, z: pl.z, r: 0.5 };
      this.colliders.push(collider); this.npcColliders.add(collider);
      this.npcs.push({ npc, rig, x: pl.x, z: pl.z, ry: pl.ry ?? 0, home: { x: pl.x, z: pl.z }, patrol: pl.patrol, leg: 0, collider, speed: 0, activity: pl.activity });
      if (pl.activity) rig.hold(pl.activity);
    }
    // where the player stands
    const spawn = typeof at === 'string' ? def.spawns[at] : at;
    const s0 = spawn ?? def.spawns.default ?? Object.values(def.spawns)[0] ?? { x: 0, z: 0, ry: 0 };
    this.body = newBody(s0.x, s0.z, s0.ry);
    this.yaw = s0.ry; this.pitch = 0.42;
    this.snapCamera();
    this.playerRig.group.position.set(s0.x, 0, s0.z); this.playerRig.setFacing(s0.ry, true);
    // state the player's code has already earned: instant, no animation
    for (const r of def.reactions ?? []) if (hasEffect(save, r.effect)) { this.dyns.get(r.prop)?.setState(r.state, true); if (r.state === 'open') this.openGate(r.prop); }
    this.refresh();
    this.audio.setAmbience(def.ambience ?? 'none');
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
    this.npcs = []; this.npcColliders.clear(); this.built.length = 0; this.dyns.clear(); this.ticks = []; this.propPos.clear(); this.colliders = []; this.active = []; this.markers = []; this.walls = []; this.camBlockers = []; this.mounted = [];
    for (const m of this.markerMeshes.values()) this.scene.remove(m);
    this.markerMeshes.clear();
    this.director.reset(); this.lapBusy = false; this.lapStop = null; this.controlLocked = false; this.playerGoal = null; this.playerFace = null; this.prompt = null; this.driver = null; this.hooks = []; this.chase = null; this.playerRig.group.visible = true; this.audio.engine(null); this.cinema = null;
  }

  /** The save changed: which interactables exist now, which things to mark, and what the world shows. Cheap; call after every action. */
  refresh(): void {
    const def = this.def; if (!def) return;
    const save = this.env.getSave();
    const all: Interactable[] = [...def.interactables.map((i) => ({ ...i })), ...def.exits.map((e): Interactable => ({ id: `exit:${e.id}`, verb: 'Enter', label: e.label, x: e.x, z: e.z, range: 1.9, action: { type: 'exit', to: e.to, spawn: e.spawn } }))];
    this.active = all.filter((i) => holds(save, i.when));
    this.markers = markersAt(this.waypoint, this.active);
    const want = new Set(this.markers.map((m) => m.id));
    for (const [id, mesh] of this.markerMeshes) if (!want.has(id)) { this.scene.remove(mesh); this.markerMeshes.delete(id); }
    for (const m of this.markers) {
      let mesh = this.markerMeshes.get(m.id);
      if (!mesh) { mesh = new Mesh(markerGeo, mat(0xffd166, 1.2)); this.scene.add(mesh); this.markerMeshes.set(m.id, mesh); }
      mesh.material = mat(0xffd166, 1.2);
      mesh.position.set(m.x, 2.3, m.z);
    }
  }

  /* ------------------------------------------------------------------ reacting to the game */

  /** Something happened in the learning engine. Show it in the world. */
  /**
   * The world answers what the learning engine says happened. Only SUCCESS is shown: a code success changes the world (a cinematic, or a quick
   * state change), a quest completion and a level-up have their own moments. A failure is not acted out here: the lesson's own feedback,
   * Focus and training handle it. Returns what the player is about to see so the screen can step aside for it.
   */
  react(events: readonly GameEvent[]): { cinematic: boolean; quick: boolean; then?: string } {
    const out: { cinematic: boolean; quick: boolean; then?: string } = { cinematic: false, quick: false };
    const def = this.def; if (!def) return out;
    let won = false;
    for (const e of events) {
      if (e.type === 'worldEffect') {
        const ref = `${e.target}:${e.action}`;
        for (const r of def.reactions ?? []) if (r.effect === ref && !r.loadOnly) {
          if (r.then && !out.then) out.then = r.then;
          const cine = r.cinematic ? this.env.cinematic?.(r.cinematic) : undefined;
          if (cine) { this.director.enqueue(cine); out.cinematic = true; if (r.state === 'open') this.openGate(r.prop); continue; } // the cinematic itself sets the prop's state
          this.dyns.get(r.prop)?.setState(r.state, false); if (r.state === 'open') this.openGate(r.prop); if (r.say) this.env.onCaption(r.say); won = true; out.quick = true;
        }
      } else if (e.type === 'questComplete') { const cine = this.env.cinematic?.(`quest:${e.id}`); if (cine) { this.director.enqueue(cine); out.cinematic = true; } else { this.audio.sfx('quest'); won = true; } }
      else if (e.type === 'levelUp') { // a level is a banner, not a cutscene: it never takes the controls away
        this.audio.sfx('success'); this.fx.burst('magic', this.body.x, 1, this.body.z, 24);
        this.director.show({ banner: { title: `Level ${e.level}`, sub: 'XP shows how far you have adventured, not what you can do: your Skills view shows that.', kind: 'level' } });
        this.tweens.after(3.6, () => this.director.show({ banner: null }));
      }
      else if (e.type === 'questAccepted') this.audio.sfx('quest');
    }
    if (won) { this.playerRig.play('success'); this.fx.burst('confetti', this.body.x, 2, this.body.z, 26); this.audio.sfx('success'); }
    this.refresh();
    return out;
  }

  /** A section of the replay lap is running for a cinematic (the sheet's clock waits for it). */
  lapBusy = false;
  private lapStop: (() => void) | null = null;
  runLap(from: number, to: number, done: (ms: number | null) => void): void {
    const run = this.env.lapSection;
    if (!run) { done(null); return; }
    this.lapBusy = true;
    this.lapStop = run(from, to, (ms) => { this.lapBusy = false; this.lapStop = null; done(ms); });
  }
  stopLap(): void { this.lapStop?.(); }

  /** Play a named cinematic now (the training arrival). Returns false when there is none, so the caller carries on without it. */
  playCinematic(ref: string): boolean { const c = this.env.cinematic?.(ref); if (!c) return false; this.director.enqueue(c); return true; }

  private openGate(prop: string): void { const c = this.propColliders.get(prop); if (c) { this.grid = null; this.pathClock = 99; this.colliders = this.colliders.filter((x) => !c.includes(x)); this.propColliders.delete(prop); this.rebuildBlockers(); } }

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
      const dt = Math.max(0, Math.min(0.1, (now - this.last) / 1000)) * this.timeScale; this.last = now; // never negative: the first frame's timestamp can precede start()'s clock // capped, but high enough that a slow machine slows the picture, not the walking speed
      this.frame(dt);
    };
    this.raf = requestAnimationFrame(tick);
  }
  pause(): void { this.running = false; cancelAnimationFrame(this.raf); this.input.clear(); }
  /** Stop for good reason (terminal open): stops rendering entirely until `start()`. */
  suspend(): void { this.wantRun = false; this.pause(); }
  setInputEnabled(on: boolean): void { this.input.enabled = on; if (!on) { this.input.clear(); this.input.releaseLock(); } else this.input.requestLock(); }

  private snapCamera(): void {
    this.updateCamera(0, true);
  }

  /** Take the camera to a fixed viewpoint (null returns it to the player). */
  setCinema(v: { x: number; y?: number; z: number; yaw: number; pitch: number; dist: number } | null): void { this.cinema = v ? { y: 1, ...v } : null; }

  private updateCamera(dt: number, snap = false): void {
    const b = this.cinema ? { x: this.cinema.x, z: this.cinema.z, y: 0 } : this.body;
    const yaw = this.cinema?.yaw ?? this.yaw, pitch = this.cinema?.pitch ?? this.pitch, dist = this.cinema?.dist ?? this.dist;
    const cy = this.cinema ? this.cinema.y : 1.5 + b.y * 0.6;
    const bd = this.def?.bounds;
    let flat = Math.cos(pitch) * dist;
    const dirX = Math.sin(yaw), dirZ = Math.cos(yaw);
    if (bd) { // outdoors there is no wall to stop the camera: keep it near the playable area
      const m = 7;
      const lim = (d: number, p: number, lo: number, hi: number) => (d > 1e-4 ? (hi + m - p) / d : d < -1e-4 ? (lo - m - p) / d : Infinity);
      flat = Math.max(1.2, Math.min(flat, lim(dirX, b.x, bd.minX, bd.maxX), lim(dirZ, b.z, bd.minZ, bd.maxZ)));
    }
    let ex = b.x + dirX * flat;
    let ey = cy + Math.max(Math.sin(pitch) * dist, (dist * Math.cos(pitch) - flat) * 0.9 + Math.sin(pitch) * flat);
    let ez = b.z + dirZ * flat;
    // THE CAMERA IS A SPRING ARM: walls, tall furniture and tree crowns between the character and the wanted camera position shorten the arm, so the
    // camera stays on the player's side of things instead of cutting objects away. (Nothing in the world ever hides because the player is near it.)
    if (!this.cinema && this.camBlockers.length) {
      const hx = b.x, hy = cy, hz = b.z, ax = ex - hx, ay = ey - hy, az = ez - hz, len = Math.hypot(ax, ay, az) || 1;
      this.ray.origin.set(hx, hy, hz); this.ray.direction.set(ax / len, ay / len, az / len);
      let near = len;
      for (const bx of this.camBlockers) {
        if (bx.containsPoint(this.ray.origin)) continue; // the player is inside it (under a crown, in a doorway): it cannot block
        const h = this.ray.intersectBox(bx, this.hit); if (h) near = Math.min(near, h.distanceTo(this.ray.origin));
      }
      const want = Math.max(Math.min(1, Math.max(0, near - 0.5) / len), Math.min(1, 1.4 / len));
      this.camK = want < this.camK ? this.camK + (want - this.camK) * Math.min(1, dt * 22 + (snap ? 1 : 0)) : this.camK + (want - this.camK) * Math.min(1, dt * 3 + (snap ? 1 : 0)); // in fast, out slowly
      ex = hx + ax * this.camK; ey = hy + ay * this.camK + (1 - this.camK) * len * 0.16; ez = hz + az * this.camK; // a short arm rises, looking down over the shoulder
    } else this.camK = 1;
    const k = snap ? 1 : 1 - Math.exp(-dt * this.camRate); // frame-rate independent follow: smooth, never laggy
    this.camPos.x += (ex - this.camPos.x) * k; this.camPos.y += (ey - this.camPos.y) * k; this.camPos.z += (ez - this.camPos.z) * k;
    this.camLook.x += (b.x - this.camLook.x) * k; this.camLook.y += (cy - this.camLook.y) * k; this.camLook.z += (b.z - this.camLook.z) * k;
    this.camPos.y = Math.max(this.camPos.y, 0.6); // never under the floor
    this.camera.position.copy(this.camPos);
    this.sky.position.copy(this.camPos);
    // a CINEMATIC may put the camera outside a room: only then are the walls it looks through cut away (never during play)
    const cut = !!this.cinema;
    for (const w of this.walls) w.obj.visible = !cut || (w.nx * (this.camPos.x - w.px) + w.nz * (this.camPos.z - w.pz)) * w.inside > -0.5;
    const bd2 = this.def?.bounds;
    const outside = cut && !!bd2 && (this.camPos.x < bd2.minX || this.camPos.x > bd2.maxX || this.camPos.z < bd2.minZ || this.camPos.z > bd2.maxZ);
    for (const m of this.mounted) m.obj.visible = !(outside && (m.nx * (this.camPos.x - m.px) + m.nz * (this.camPos.z - m.pz)) < -0.5);
    if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt * 2); this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.3; this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.3; }
    this.camera.lookAt(this.camLook);
  }

  private frame(dt: number): void {
    this.t += dt;
    const inp = this.input;
    if (!this.controlLocked && inp.wasPressed('Escape')) this.env.onPause();
    if (!this.controlLocked) { if (inp.wasPressed('m')) this.env.onAction?.('map'); if (inp.wasPressed('j')) this.env.onAction?.('journal'); if (inp.wasPressed('i')) this.env.onAction?.('inventory'); if (inp.wasPressed('h')) this.env.onAction?.('manual'); }
    // camera: mouse drag, wheel, Q/R keys (for players without a mouse)
    if (!this.controlLocked) { this.yaw -= inp.dragX; this.pitch = Math.max(0.12, Math.min(1.2, this.pitch + inp.dragY)); }
    if (inp.isDown('q')) this.yaw += dt * 1.8;
    if (inp.isDown('r')) this.yaw -= dt * 1.8;
    if (inp.wheel) this.dist = Math.max(3.5, Math.min(12, this.dist + inp.wheel * 0.8));

    if (this.director.active) {
      if (inp.wasPressed(' ', 'e', 'f', 'Escape') && this.director.running) this.director.skip();
      this.director.update(dt);
    }
    if (this.driver) this.driver(dt, inp);
    else this.walk(dt);

    // NPCs: patrol, and watch the player when close
    for (const n of this.npcs) this.updateNpc(n, dt);
    for (const d of this.dyns.values()) d.update?.(dt, this.t);
    for (const f of this.ticks) f(dt, this.t);
    for (const h of this.hooks) h(dt, this.t);
    this.tweens.update(dt);
    this.fx.update(dt);
    // markers bob
    for (const [id, m] of this.markerMeshes) { m.rotation.y += dt * 2; const base = this.markers.find((x) => x.id === id); if (base) m.position.y = (base ? 2.3 : 2.3) + Math.sin(this.t * 3) * 0.08; }

    this.updateGuide(dt);

    // interaction prompt
    if (!this.driver && !this.controlLocked) {
      const it = nearestInteractable(this.body.x, this.body.z, this.body.ry, this.active);
      if (it?.id !== this.prompt?.id) { this.prompt = it; this.env.onPrompt(it); }
      if (!this.driver) this.playerRig.lookAt(it ? it.x : null, it?.z); // the character looks at what they could use
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

  /** Keep the trail pointing at the objective (a path is re-planned when the player has moved, around the colliders as they are right now). */
  private updateGuide(dt: number): void {
    const w = this.waypoint, def = this.def;
    this.guide.update(dt, this.t, this.body.x, this.body.z, this.reduced);
    if (!w || !def) return;
    this.pathClock += dt; this.guideClock += dt;
    if (this.pathClock > 0.4 && Math.hypot(this.body.x - this.lastGuideX, this.body.z - this.lastGuideZ) > 0.6) {
      this.pathClock = 0; this.lastGuideX = this.body.x; this.lastGuideZ = this.body.z;
      this.grid ??= buildGrid(def.bounds, this.colliders.filter((c) => !(c.kind === 'circle' && c.r === 0.5)));
      const pts = findPath(this.grid, { x: this.body.x, z: this.body.z }, { x: w.x, z: w.z });
      this.guide.setPath(pts);
      this.pathDist = pts ? pathLength(pts) : Math.hypot(w.x - this.body.x, w.z - this.body.z);
      this.pathHeading = pts && pts.length > 1 ? Math.atan2(pts[1]!.x - this.body.x, pts[1]!.z - this.body.z) : Math.atan2(w.x - this.body.x, w.z - this.body.z);
    }
    if (this.guideClock > 0.15) {
      this.guideClock = 0;
      // bearing: the way to go, as seen from where the camera looks (0 = straight ahead, positive = to the right)
      let b = (Math.PI - this.pathHeading) - this.yaw; while (b > Math.PI) b -= 2 * Math.PI; while (b < -Math.PI) b += 2 * Math.PI;
      this.env.onGuide?.({ dist: this.pathDist, bearing: b, via: w.via, label: w.label });
    }
  }
  private pathDist = 0; private pathHeading = 0;

  private walk(dt: number): void {
    const inp = this.input, b = this.body, def = this.def;
    if (!def) return;
    if (inp.isDown('w', 'ArrowUp', 's', 'ArrowDown', 'a', 'ArrowLeft', 'd', 'ArrowRight', ' ', 'Shift')) this.audio.resume();
    const f = (inp.isDown('w', 'ArrowUp') ? 1 : 0) - (inp.isDown('s', 'ArrowDown') ? 1 : 0);
    const r = (inp.isDown('d', 'ArrowRight') ? 1 : 0) - (inp.isDown('a', 'ArrowLeft') ? 1 : 0);
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw); // away from the camera
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let run = inp.isDown('Shift');
    let dx = fx * f + rx * r, dz = fz * f + rz * r, jump = inp.isDown(' ');
    if (this.controlLocked) {
      // a cinematic: the player stands still, or walks where the script says
      dx = 0; dz = 0; jump = false; run = false;
      if (this.playerGoal) { const gx = this.playerGoal.x - b.x, gz = this.playerGoal.z - b.z, gd = Math.hypot(gx, gz); if (gd < 0.15) this.playerGoal = null; else { dx = gx / gd; dz = gz / gd; } }
    }
    const wasAir = !b.onGround;
    stepBody(b, { dx, dz, run, jump }, this.colliders, def.bounds, dt);
    if (this.controlLocked && !this.playerGoal && this.playerFace) { const fy = Math.atan2(-(this.playerFace.x - b.x), -(this.playerFace.z - b.z)); let d = fy - b.ry; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; b.ry += d * Math.min(1, dt * 6); }
    if (wasAir && b.onGround) { this.audio.sfx('step'); this.fx.burst('dust', b.x, 0.06, b.z, 8, 0.6); }
    const speed = Math.hypot(b.vx, b.vz);
    const pose = poseOf(b, run);
    this.playerRig.update(dt, pose, speed);
    if (speed > 0.6 && b.onGround) { this.stepClock += dt * (run ? 4 : 3); if (this.stepClock > 1) { this.stepClock = 0; this.audio.sfx('step'); if (run) this.fx.burst('dust', b.x, 0.06, b.z, 3, 0.35); } }
    if (!wasAir && !b.onGround) this.audio.sfx('jump');
    this.playerRig.group.position.set(b.x, b.y, b.z); this.playerRig.setFacing(b.ry);
  }

  private updateNpc(n: NpcRuntime, dt: number): void {
    const dx = this.body.x - n.x, dz = this.body.z - n.z, d = Math.hypot(dx, dz);
    let moving = false;
    const turnTo = (tx: number, tz: number, rate: number) => { const target = Math.atan2(-tx, -tz); let df = target - n.ry; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI; n.ry += df * (1 - Math.exp(-dt * rate)); };
    if (n.goal) {
      const tx = n.goal.x - n.x, tz = n.goal.z - n.z, td = Math.hypot(tx, tz);
      if (td < 0.12) { n.home = { ...n.goal }; n.goal = undefined; }
      else { const step = Math.min(td, dt * 1.7); n.x += (tx / td) * step; n.z += (tz / td) * step; turnTo(tx, tz, 10); moving = true; }
    } else if (n.faceTarget) turnTo(n.faceTarget.x - n.x, n.faceTarget.z - n.z, 6);
    else if (n.patrol && n.patrol.length > 1 && d > 4) {
      const tgt = n.patrol[n.leg % n.patrol.length]!;
      const tx = tgt.x - n.x, tz = tgt.z - n.z, td = Math.hypot(tx, tz);
      if (td < 0.2) n.leg++;
      else { n.x += (tx / td) * dt * 1.0; n.z += (tz / td) * dt * 1.0; turnTo(tx, tz, 8); moving = true; }
    } else if (d < 5 && !this.controlLocked) turnTo(dx, dz, 3.5);
    // greet a newcomer once with a wave; people at work stop to look up when the player is close
    if (!this.controlLocked) {
      if (d < 4.6 && !n.greeted) { n.greeted = true; if (!n.activity) n.rig.play('wave'); }
      else if (d > 9) n.greeted = false;
      if (n.activity) { if (d < 3.4) n.rig.release(); else if (d > 5) n.rig.hold(n.activity); }
    }
    // idle life: now and then a thought, a nod or a shrug (not while busy, walking or being talked to)
    if (!moving && !n.activity && !this.controlLocked && !n.faceTarget) { n.idleIn = (n.idleIn ?? 4 + Math.random() * 8) - dt; if (n.idleIn <= 0) { n.idleIn = 7 + Math.random() * 9; const pool = n.npc.idles?.length ? n.npc.idles : (['think', 'shrug', 'nod'] as const); n.rig.play(pool[Math.floor(Math.random() * pool.length)]!); } }
    // people do not walk through scenery or each other: they are pushed out of anything that blocks, like the player
    if (moving) for (const c of this.colliders) { if (this.npcColliders.has(c)) continue; [n.x, n.z] = pushOut(n.x, n.z, 0.35, c); }
    n.collider.x = n.x; n.collider.z = n.z;
    // someone who walks about is talked to where they are, not where they started
    if (n.patrol) for (const it of this.active) if (it.action.type === 'talk' && it.action.npc === n.npc.id) { it.x = n.x; it.z = n.z; }
    n.rig.group.position.set(n.x, 0, n.z); n.rig.setFacing(n.ry);
    n.rig.update(dt, moving ? 'walk' : 'idle', moving ? (n.goal ? 1.7 : 1.0) : 0);
    if (!this.controlLocked) { if (d < 6) n.rig.lookAt(this.body.x, this.body.z); else n.rig.lookAt(null); }
  }

  /* ------------------------------------------------------------------ test and debug surface (read-only state; teleport only for e2e) */

  /** Read-only access for the integrity check. */
  get solidColliders(): readonly Collider[] { const npc = new Set<Collider>(this.npcs.map((n) => n.collider)); return this.colliders.filter((c) => !npc.has(c)); }
  get npcSpots(): { id: string; x: number; z: number }[] { return this.npcs.map((n) => ({ id: n.npc.id, x: n.x, z: n.z })); }
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
    this.guide.dispose(); this.fx.dispose(); this.audio.dispose(); this.input.dispose();
    this.resizeObs?.disconnect(); window.removeEventListener('resize', this.onResize); document.removeEventListener('visibilitychange', this.onVisibility);
    this.renderer.dispose(); this.renderer.forceContextLoss();
  }
}
