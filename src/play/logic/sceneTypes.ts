/**
 * SCENE DATA: what a place in the playable world IS, as plain data (no three.js here). The engine builds meshes from it, the logic tests
 * walk through it in Node, and a scene is added by writing one file in content/play/scenes/ (no engine change).
 *
 * Units are metres. X is east, Z is south (toward the camera at the start), Y is up. Rotation `ry` is radians about Y (0 faces -Z, north).
 */
import type { SkillReq } from '../../content/schema';

export type WorldId = 'hub' | 'robotics' | 'academy' | 'ballpark' | 'racing' | 'summit';

export type Vec2 = { x: number; z: number };

/** A thing the player cannot walk through. Boxes are axis-aligned footprints; `h` lets a jump clear low ones. */
export type Collider =
  | { kind: 'box'; x: number; z: number; w: number; d: number; h?: number }
  | { kind: 'circle'; x: number; z: number; r: number; h?: number };

/** A visible thing. `kind` names a builder in engine/builders.ts (box, cylinder, terminal, robot, ...); `p` are its parameters. */
export interface Prop {
  kind: string;
  /** Position of the prop's base centre. */
  x: number; y?: number; z: number;
  ry?: number;
  /** Builder-specific parameters: sizes, colours, labels. */
  p?: Record<string, number | string | boolean>;
  /** Names the object so world state can change it (`bolt`, `door-east`). */
  id?: string;
  /** Walk-blocking footprint. Omit for decoration. `auto` derives a box from the prop's size. */
  solid?: boolean | { w: number; d: number; h?: number };
}

/** What happens when the player presses E at an interactable. */
export type InteractAction =
  | { type: 'talk'; npc: string }
  | { type: 'inspect'; id: string; text: string; /** Extra text once code has changed this object. */ after?: { effect: string; text: string } }
  | { type: 'terminal'; station: string }
  | { type: 'exit'; to: string; spawn?: string }
  | { type: 'vehicle'; vehicle: string }
  | { type: 'panel'; panel: 'map' | 'training' | 'daily' | 'lineup' | 'setup' | 'spellbook' }
  | { type: 'sim'; sim: 'baseball' }
  | { type: 'boss'; boss: string }
  /** A chest, toolbox or locker: opens once for a small reward (coins), and can be looked at again. */
  | { type: 'container'; id: string; text: string; coins: number };

export interface Interactable {
  id: string;
  /** Word after [E]: "Talk", "Use Terminal", "Repair", "Enter Garage". */
  verb: string;
  /** What it is: "Engineer Ori", "Diagnostics console". */
  label: string;
  x: number; z: number;
  /** How close the player must be (metres from x,z). Default 2.2. */
  range?: number;
  action: InteractAction;
  /** Hidden until this is true of the save (a door that only exists after a quest step, a chest). Evaluated by logic/conditions. */
  when?: Condition;
}

export interface NpcPlacement {
  npc: string;
  x: number; z: number; ry?: number;
  /** Walk a short loop between these points (idle life). Omitted NPCs stand and face the player when near. */
  patrol?: Vec2[];
  /** What they are busy doing while nobody talks to them (held until the player comes close). */
  activity?: 'work' | 'think';
}

export interface Exit {
  id: string;
  label: string;
  x: number; z: number;
  to: string;
  /** Which spawn point of the target scene to arrive at. */
  spawn?: string;
  /** The learning-graph area whose access rule gates this door (content/world.ts `Area.lock`), if any. */
  area?: string;
  /** Or competencies the player must have shown (the skill graph is the only authority; the panel names exactly what is missing). */
  requires?: SkillReq[];
  reason?: string;
}

/** A condition on the save, used for dialogue, interactables and quest stages. All given keys must hold. */
export interface Condition {
  quest?: { id: string; status: ('unavailable' | 'available' | 'accepted' | 'in-progress' | 'completed')[] };
  /** `target:action` in the derived world state. */
  effect?: string;
  notEffect?: string;
  lessonDone?: string;
  met?: string;
  notMet?: string;
  seen?: string;
  notSeen?: string;
  /** A boss id that has been passed. */
  bossPassed?: string;
  not?: Condition;
  any?: Condition[];
}

/** When code causes `effect` (`target:action`), put `state` on the prop named `prop` (animated live, instant when the scene is loaded later). */
export interface Reaction { prop: string; effect: string; state: string; /** Caption shown (and announced) when it happens live. */ say?: string; /** A cinematic (content/play/cinematics.ts) that shows this change with camera, animation, sound and NPC reactions instead of a bare state change. It must set the prop's state itself. */ cinematic?: string; /** Applied only when the place is loaded (restoring earned state); a live change is shown by another reaction's cinematic instead of twice. */ loadOnly?: boolean }
/** When a graded attempt at a station's challenges FAILS, the prop reacts (sparks, a jam, a misfire) and the caption says what went wrong in the world. */
export interface Consequence { prop: string; station: string; play: string; say: string; /** A cinematic that plays instead of the bare malfunction. */ cinematic?: string }

export interface SceneDef {
  id: string;
  world: WorldId;
  title: string;
  /** One line shown when the player arrives. */
  blurb: string;
  /** The walkable rectangle. */
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  spawns: Record<string, { x: number; z: number; ry: number }>;
  /** Sky/fog/ground colours and light mood. */
  look: { sky: number; fog: number; fogNear?: number; fogFar?: number; ground: number; ambient?: number; sun?: number; sunDir?: [number, number, number]; night?: boolean; /** Up to four coloured point lights (lamps, screens, magic) that give a place its mood. */ lights?: { x: number; y: number; z: number; color: number; intensity: number; dist?: number }[] };
  props: Prop[];
  npcs: NpcPlacement[];
  interactables: Interactable[];
  exits: Exit[];
  reactions?: Reaction[];
  consequences?: Consequence[];
  /** Extra colliders not tied to a prop (invisible walls). */
  walls?: Collider[];
  /** Soundscape name for engine/audio.ts. */
  ambience?: 'workshop' | 'wind' | 'crowd' | 'engine' | 'magic' | 'summit' | 'none';
  /** Rooms (labels shown on the minimap/objective markers). */
  zones?: { id: string; label: string; x: number; z: number; w: number; d: number }[];
}
