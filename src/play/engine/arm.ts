/**
 * AN INDUSTRIAL ARM, as a scene object: a base, a turret that yaws, an upper arm and a forearm that pitch, and a wrist that stays square so the
 * tool always points down. The joint angles come from `armMotion.ts` (which plans how a real arm moves); this file only turns them into
 * rotations and gives the tool a gripper, so the same machine is used by the repair rig in the bay and the assembly arms on the line.
 */
import { Group, type Mesh } from 'three';
import { ArmPlanner, DEFAULT_LIMITS, DEFAULT_VMAX, type ArmSpec, type Pose, type V3 } from './armMotion';

/** Makes centred pieces: the two looks in the game (toon characters and standard-shaded props) both fit this shape. */
export interface PartMaker {
  box(w: number, h: number, d: number, color: number, o?: { x?: number; y?: number; z?: number; rx?: number; rz?: number; glow?: number }): Mesh;
  cyl(rt: number, rb: number, h: number, color: number, o?: { x?: number; y?: number; z?: number; rx?: number; rz?: number; glow?: number }): Mesh;
  sph(r: number, color: number, o?: { x?: number; y?: number; z?: number; glow?: number }): Mesh;
}

export interface ArmOptions {
  L1: number; L2: number; H: number; T: number;
  /** Colours: base, upper arm, forearm, tool. */
  colors?: { base?: number; upper?: number; fore?: number; steel?: number };
  /** Overall thickness of the links (1 = as drawn for a big arm). */
  gauge?: number;
  torch?: boolean;
}

export interface ArmRig {
  group: Group; turret: Group; tool: Group; torch?: Mesh;
  /** Put the joints at these angles (the planner's output). */
  apply(q: Pose): void;
  /** Gripper opening: 1 open, 0 closed. */
  setGrip(g: number): void;
}

export function buildArm(mk: PartMaker, o: ArmOptions, facing: number): ArmRig {
  const { L1, L2, H, T } = o, k = o.gauge ?? 1;
  const c = { base: 0x2a2f45, upper: 0xf2c14e, fore: 0xe8a93a, steel: 0x596080, ...o.colors };
  const g = new Group();
  g.add(mk.cyl(0.95 * k, 1.05 * k, 0.28 * k, c.base, { y: 0.14 * k }), mk.cyl(0.62 * k, 0.7 * k, H * 0.6, c.steel, { y: 0.28 * k + (H * 0.6) / 2 }), mk.box(0.5 * k, 0.06 * k, 0.06 * k, 0xff9f1c, { y: 0.45 * k, z: 0.66 * k, glow: 0.8 }));
  const turret = new Group(); turret.position.y = H; g.add(turret);
  turret.add(mk.sph(0.5 * k, c.upper));
  const upper = new Group(); turret.add(upper);
  upper.add(mk.box(L1, 0.42 * k, 0.44 * k, c.upper, { x: L1 / 2 }), mk.cyl(0.12 * k, 0.12 * k, 0.5 * k, c.base, { rx: Math.PI / 2 }));
  const fore = new Group(); fore.position.x = L1; upper.add(fore);
  fore.add(mk.sph(0.36 * k, c.fore), mk.box(L2, 0.34 * k, 0.36 * k, c.fore, { x: L2 / 2 }), mk.cyl(0.1 * k, 0.1 * k, 0.42 * k, c.base, { rx: Math.PI / 2 }));
  const wrist = new Group(); wrist.position.x = L2; fore.add(wrist);
  wrist.add(mk.sph(0.24 * k, c.steel), mk.box(0.16 * k, T, 0.16 * k, c.steel, { y: -T / 2 }));
  const tool = new Group(); tool.name = 'arm-tool'; tool.position.y = -T; wrist.add(tool);
  const fingerL = mk.box(0.06 * k, 0.28 * k, 0.08 * k, 0xcfd6ea, { x: -0.1 * k, y: -0.14 * k }), fingerR = mk.box(0.06 * k, 0.28 * k, 0.08 * k, 0xcfd6ea, { x: 0.1 * k, y: -0.14 * k });
  tool.add(fingerL, fingerR);
  const torch = o.torch ? mk.cyl(0.035 * k, 0.015 * k, 0.3 * k, 0x8be9fd, { y: -0.12 * k, z: 0.15 * k, rx: 0.4 }) : undefined;
  if (torch) tool.add(torch);
  return {
    group: g, turret, tool, torch,
    apply(q) { turret.rotation.y = q.yaw + facing; upper.rotation.z = q.sh; fore.rotation.z = q.el; wrist.rotation.z = -(q.sh + q.el); },
    setGrip(v) { fingerL.position.x = (-0.05 - 0.05 * v) * k; fingerR.position.x = (0.05 + 0.05 * v) * k; },
  };
}

/** A planner for an arm standing at (x, z), facing a direction, with the speeds of a machine of that size. */
export function plannerFor(o: ArmOptions, base: { x: number; z: number }, facing: number, home: V3, speed = 1): ArmPlanner {
  const spec: ArmSpec = {
    L1: o.L1, L2: o.L2, H: o.H, T: o.T, base, facing,
    limits: DEFAULT_LIMITS,
    vmax: { yaw: DEFAULT_VMAX.yaw * speed, sh: DEFAULT_VMAX.sh * speed, el: DEFAULT_VMAX.el * speed },
    vTool: 0.85 * speed, floor: 0.1,
  };
  return new ArmPlanner(spec, home);
}

/** The two machines in the game. Sizes are in one place so the tests can prove that what the scripts ask for is within reach. */
export const REPAIR_ARM: ArmOptions = { L1: 2.5, L2: 2.3, H: 1.55, T: 0.55, gauge: 1, torch: true, colors: { base: 0x2a2f45, upper: 0xf2c14e, fore: 0xe8a93a, steel: 0x596080 } };
export const ASSEMBLY_ARM: ArmOptions = { L1: 1.9, L2: 1.7, H: 1.1, T: 0.42, gauge: 0.85, colors: { base: 0x2b3048, upper: 0xf2c14e, fore: 0xe8a93a, steel: 0x596080 } };
/** Where an assembly arm picks a part and where it drops it, relative to the belt in front of it. */
export const assemblyPoints = (base: { x: number; z: number }, beltZ: number) => ({ pick: { x: base.x - 1.1, z: beltZ }, drop: { x: base.x + 1.1, z: beltZ + 0.1 }, rest: { x: base.x, y: 2.0, z: base.z + 2.0 }, beltY: 0.95, clear: 1.75 });
