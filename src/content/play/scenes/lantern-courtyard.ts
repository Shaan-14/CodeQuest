import type { SceneDef } from '../../../play/logic/sceneTypes';

/** LANTERNHOLLOW ACADEMY, COURTYARD: a school of lantern-craft in a wooded hollow. Original setting: towers, a pond, glow-trees and a lantern that has gone dark. */
export const lanternCourtyard: SceneDef = {
  id: 'lantern-courtyard', world: 'academy', title: 'Lanternhollow Courtyard', blurb: 'A school in a hollow, lit by lanterns. Some of them have gone dark.',
  bounds: { minX: -20, maxX: 20, minZ: -15, maxZ: 13 },
  spawns: { default: { x: 0, z: 10, ry: 0 }, 'from-plaza': { x: 0, z: 10.5, ry: 0 }, 'from-hall': { x: 0, z: -9.5, ry: Math.PI }, 'from-arena': { x: 16, z: 0, ry: Math.PI / 2 } },
  look: { sky: 0x2a2250, fog: 0x3a2f66, fogNear: 26, fogFar: 64, ground: 0x2f5a46, ambient: 0.55, sun: 0.75, sunDir: [-0.4, 1, 0.3], night: true },
  ambience: 'magic',
  zones: [{ id: 'pond', label: 'Pond', x: 0, z: 0, w: 8, d: 8 }, { id: 'hall', label: 'Runecraft Hall', x: 0, z: -12, w: 10, d: 4 }],
  props: [
    { kind: 'ground', x: 0, z: -1, p: { w: 38, d: 26, color: 0x4d7a54, lift: 0.01 } },
    { kind: 'ground', x: 0, z: -1, p: { w: 5, d: 26, color: 0x9a94b0, lift: 0.02 } },
    { kind: 'ground', x: 9, z: 0, p: { w: 18, d: 4, color: 0x9a94b0, lift: 0.02 } },
    // the great hall (north) with its doors, flanked by towers
    { kind: 'castleWall', x: -8, z: -13.5, p: { w: 12, h: 6 }, solid: { w: 12, d: 0.8 } },
    { kind: 'castleWall', x: 8, z: -13.5, p: { w: 12, h: 6 }, solid: { w: 12, d: 0.8 } },
    { kind: 'castleWall', x: 0, z: -13.5, p: { w: 4, h: 7.5 } },
    { kind: 'archway', x: 0, z: -12.9, p: { w: 3, h: 3.6, text: 'RUNECRAFT HALL', color: 0xb48cff, portal: false } },
    { kind: 'tower', x: -15, z: -13, p: { w: 4, h: 11 }, solid: { w: 4, d: 4 } }, { kind: 'tower', x: 15, z: -13, p: { w: 4, h: 11 }, solid: { w: 4, d: 4 } },
    // pond and statue
    { kind: 'pond', x: 0, z: 0, p: { w: 9 } }, { kind: 'statue', x: 0, z: 0, solid: { w: 2.4, d: 2.4 } },
    { kind: 'lantern', x: -3.5, z: 3.5, id: 'dark-lantern', p: { lit: false, h: 2.2 }, solid: { w: 0.4, d: 0.4 } },
    { kind: 'lantern', x: 3.5, z: 3.5, p: { h: 2.2 }, solid: { w: 0.4, d: 0.4 } }, { kind: 'lantern', x: -3.5, z: -3.5, p: { h: 2.2 }, solid: { w: 0.4, d: 0.4 } }, { kind: 'lantern', x: 3.5, z: -3.5, p: { h: 2.2 }, solid: { w: 0.4, d: 0.4 } },
    { kind: 'lantern', x: -2.4, z: 11, p: { h: 2.6 } }, { kind: 'lantern', x: 2.4, z: 11, p: { h: 2.6 } },
    // east gate to the arena
    { kind: 'archway', x: 19.4, z: 0, ry: -Math.PI / 2, p: { w: 3.4, h: 3.8, text: 'DUELING RING', color: 0xff79c6, portal: false } },
    { kind: 'hedge', x: 12, z: 6, p: { w: 10, h: 1.4 }, solid: { w: 10, d: 0.9 } }, { kind: 'hedge', x: -12, z: 6, p: { w: 10, h: 1.4 }, solid: { w: 10, d: 0.9 } },
    { kind: 'hedge', x: -10, z: -6, p: { w: 6, h: 1.4 }, solid: { w: 6, d: 0.9 } },
    { kind: 'bench', x: 7, z: 4, ry: Math.PI, solid: { w: 1.6, d: 0.5 } }, { kind: 'bench', x: -7, z: -2, solid: { w: 1.6, d: 0.5 } },
    ...[[-14, 2], [-16, 9], [14, 9], [16, -6], [-18, -4], [10, -8], [-6, 11], [6, 12]].map(([x, z], i) => ({ kind: 'glowtree', x: x!, z: z!, p: { scale: 0.9 + (i % 3) * 0.15 }, solid: { w: 0.8, d: 0.8 } })),
    { kind: 'crystal', x: -17, z: 4, p: { color: 0x5ee6d0, h: 1.8 } }, { kind: 'crystal', x: 17, z: 6, p: { color: 0xb48cff, h: 2.2 } },
  ],
  npcs: [{ npc: 'teselle', x: 4.6, z: 0.6, ry: Math.PI / 2 }, { npc: 'nim', x: -6, z: 7, ry: 0.8, patrol: [{ x: -6, z: 7 }, { x: -2, z: 8 }, { x: -2, z: 4.5 }, { x: -6, z: 4.5 }] }],
  interactables: [
    { id: 'talk-teselle', verb: 'Talk', label: 'Warden Teselle', x: 4.6, z: 0.6, action: { type: 'talk', npc: 'teselle' } },
    { id: 'talk-nim', verb: 'Talk', label: 'Apprentice Nim', x: -6, z: 7, range: 2.6, action: { type: 'talk', npc: 'nim' } },
    { id: 'dark-lantern', verb: 'Inspect', label: 'the dark lantern', x: -3.5, z: 3.5, range: 2.4, action: { type: 'inspect', id: 'dark-lantern', text: 'The lantern is cold. There is nothing wrong with the flame-stone; the glass is clean. But the rune scratched into its base, the one that tells the lantern what it is, is half-written: one line is simply missing. The lantern does exactly what its rune says, and its rune says almost nothing.' } },
  ],
  exits: [
    { id: 'to-hall', label: 'the Runecraft Hall', x: 0, z: -12, to: 'spell-classroom', spawn: 'door' },
    { id: 'to-arena', label: 'the Dueling Ring', x: 18.4, z: 0, to: 'arena', spawn: 'door' },
    { id: 'to-plaza', label: 'Bytehaven Plaza', x: 0, z: 12, to: 'plaza', spawn: 'from-academy' },
  ],
};
