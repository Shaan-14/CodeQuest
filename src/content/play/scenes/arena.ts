import type { SceneDef } from '../../../play/logic/sceneTypes';

/** THE DUELING RING: a stone ring where the Gloomhound has crept in. Incantations (JavaScript) are cast from the lectern; working spells hit it, failing ones let it strike. */
export const arena: SceneDef = {
  id: 'arena', world: 'academy', title: 'The Dueling Ring', blurb: 'The Gloomhound is eating the light. Only incantations that work can hurt it.',
  bounds: { minX: -15, maxX: 15, minZ: -15, maxZ: 11 },
  spawns: { default: { x: -12, z: 0, ry: -Math.PI / 2 }, door: { x: -12, z: 0, ry: -Math.PI / 2 } },
  look: { sky: 0x1a1536, fog: 0x1f1942, fogNear: 22, fogFar: 54, ground: 0x2a2440, ambient: 0.5, sun: 0.6, night: true },
  ambience: 'magic',
  props: [
    { kind: 'ground', x: 0, z: -2, p: { w: 30, d: 26, color: 0x3d3660, lift: 0.01 } },
    { kind: 'cyl', x: 0, z: -3, p: { w: 24, h: 0.12, color: 0x57507e } }, { kind: 'cyl', x: 0, z: -3, y: 0.12, p: { w: 19, h: 0.05, color: 0x6a6394, glow: 0.12 } },
    { kind: 'castleWall', x: -14.8, z: -2, ry: Math.PI / 2, p: { w: 26, h: 3.4 }, solid: { w: 26, d: 0.8 } }, { kind: 'castleWall', x: 14.8, z: -2, ry: Math.PI / 2, p: { w: 26, h: 3.4 }, solid: { w: 26, d: 0.8 } },
    { kind: 'castleWall', x: 0, z: -14.8, p: { w: 30, h: 3.4 }, solid: { w: 30, d: 0.8 } },
    { kind: 'castleWall', x: -8.5, z: 10.8, p: { w: 13, h: 3.4 }, solid: { w: 13, d: 0.8 } }, { kind: 'castleWall', x: 8.5, z: 10.8, p: { w: 13, h: 3.4 }, solid: { w: 13, d: 0.8 } },
    { kind: 'archway', x: -14.4, z: 0, ry: Math.PI / 2, p: { w: 3.4, h: 3.6, text: 'COURTYARD', color: 0xb48cff, portal: false } },
    { kind: 'orb', x: 0, z: -3, id: 'orb', solid: { w: 1.0, d: 1.0 } },
    { kind: 'hound', x: 0, z: -9.5, ry: 0, id: 'hound' },
    // six lanterns around the ring, dark until the DOM spell lights them
    ...[[-9, -10], [9, -10], [-11, -3], [11, -3], [-8, 4], [8, 4]].map(([x, z], i) => ({ kind: 'lantern', x: x!, z: z!, id: `ring-${i}`, p: { lit: false, h: 2.6 }, solid: { w: 0.4, d: 0.4 } })),
    { kind: 'lectern', x: -7, z: 2.5, id: 'spell-lectern', p: { text: 'INCANTATIONS|JavaScript', color: 0xff79c6 }, solid: { w: 1.3, d: 0.9 } },
    { kind: 'well', x: 10.5, z: 6.5, id: 'oracle', p: { says: 'YOU ASKED.|I ANSWER.' }, solid: { w: 2.4, d: 2.4 } },
    { kind: 'crystal', x: -12.5, z: -10, p: { color: 0xff79c6, h: 2.2 } }, { kind: 'crystal', x: 12.5, z: -10, p: { color: 0x5ee6d0, h: 2.2 } },
  ],
  npcs: [{ npc: 'nim', x: -9.5, z: 4.5, ry: 0.4 }],
  interactables: [
    { id: 'talk-nim-arena', verb: 'Talk', label: 'Apprentice Nim', x: -9.5, z: 4.5, action: { type: 'talk', npc: 'nim' } },
    { id: 'spell-lectern', verb: 'Use', label: 'the Incantation Lectern', x: -7, z: 3.7, action: { type: 'terminal', station: 'spell-lectern' } },
    { id: 'orb-look', verb: 'Inspect', label: 'the altar orb', x: 0, z: -1.5, range: 2.5, action: { type: 'inspect', id: 'altar-orb', text: 'A grey orb on a stone altar. It is waiting for an incantation to wake it.', after: { effect: 'arena.orb:spark', text: 'The orb hums violet. It is ready to carry your spells.' } } },
    { id: 'oracle-look', verb: 'Inspect', label: 'the oracle well', x: 9, z: 5, range: 2.5, action: { type: 'inspect', id: 'oracle-well', text: 'A deep well with a thin, waiting silence in it. A spirit lives at the bottom and answers questions, but only when you summon it by name, in the right language, across the river of the network.', after: { effect: 'arena.oracle:answer', text: 'The spirit of the well rises and speaks. Your summoning reached it and it answered: data from a server, in your hands.' } } },
  ],
  exits: [{ id: 'to-courtyard', label: 'the courtyard', x: -13.6, z: 0, to: 'lantern-courtyard', spawn: 'from-arena' }],
  reactions: [
    { prop: 'orb', effect: 'arena.orb:spark', state: 'spark', say: 'The altar orb wakes: your first incantation runs.' },
    { prop: 'hound', effect: 'arena.hound:hit1', state: 'hit1', say: 'Your spell strikes the Gloomhound. It recoils.' },
    { prop: 'ring-0', effect: 'arena.lanterns:light', state: 'light', say: 'You changed the page itself: the ring’s lanterns light one after another.' },
    { prop: 'ring-1', effect: 'arena.lanterns:light', state: 'light' }, { prop: 'ring-2', effect: 'arena.lanterns:light', state: 'light' }, { prop: 'ring-3', effect: 'arena.lanterns:light', state: 'light' }, { prop: 'ring-4', effect: 'arena.lanterns:light', state: 'light' }, { prop: 'ring-5', effect: 'arena.lanterns:light', state: 'light' },
    { prop: 'hound', effect: 'arena.hound:hit2', state: 'hit2', say: 'A click casts the spell. The Gloomhound staggers.' },
    { prop: 'hound', effect: 'arena.hound:hit3', state: 'hit3', say: 'The form-spell lands. The Gloomhound howls.' },
    { prop: 'hound', effect: 'arena.hound:hit4', state: 'hit4', say: 'Your spell arrives exactly when it should. The Gloomhound is nearly gone.' },
    { prop: 'oracle', effect: 'arena.oracle:answer', state: 'answer', say: 'The oracle answers: your request reached the server and came back.' },
    { prop: 'hound', effect: 'arena.hound:defeat', state: 'defeat', say: 'The Gloomhound dissolves into motes of light. The Dueling Ring is safe.' },
  ],
  consequences: [
    { prop: 'hound', station: 'spell-lectern', play: 'malfunction', say: 'The spell misfires. The Gloomhound lunges and your ward-shield cracks. Nothing is lost: look at what the spell actually did, then try again.' },
  ],
};
