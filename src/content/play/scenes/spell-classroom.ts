import type { SceneDef } from '../../../play/logic/sceneTypes';
import { room } from './kit';

/** RUNECRAFT HALL: where runes (HTML) are written and wards (CSS) are raised. Everything the player writes here is visible in the hall itself. */
export const spellClassroom: SceneDef = {
  id: 'spell-classroom', world: 'academy', title: 'Runecraft Hall', blurb: 'Two lecterns: runes give things meaning, wards give them form.',
  bounds: { minX: -13, maxX: 13, minZ: -10, maxZ: 9 },
  spawns: { default: { x: 0, z: 7, ry: 0 }, door: { x: 0, z: 7, ry: 0 } },
  look: { sky: 0x231b3f, fog: 0x231b3f, fogNear: 26, fogFar: 60, ground: 0x2a2440, ambient: 0.6, sun: 0.7, night: true },
  ambience: 'magic',
  props: [
    { kind: 'floor', x: 0, z: -0.5, p: { w: 26, d: 19, color: 0x4a4266, color2: 0x544b74, tile: 2 } },
    ...room(-13, 13, -10, 9, { h: 6, color: 0x6c6690, trim: 0xb48cff, gaps: { south: [0, 3.4] } }),
    { kind: 'archway', x: 0, z: 8.6, ry: Math.PI, p: { w: 3.4, h: 3.4, text: 'COURTYARD', color: 0xb48cff, portal: false } },
    // the hall's living parts (what the student's runes and wards change)
    { kind: 'banner', x: 0, z: -9.5, id: 'banner', p: { w: 3.2, h: 5, text: '🏮', color: 0x5a3f8c } },
    { kind: 'portal', x: -8, z: -9.3, id: 'portal', p: { w: 3, h: 3.8 } },
    { kind: 'statusScreen', x: 8, z: -9.6, id: 'crest', p: { w: 3.4, h: 2, y: 1.8, off: 'THE TRIAL OF RUNES|unsealed', on: 'THE TRIAL OF RUNES|PASSED', fg: '#ffd98a', bg: '#241a3a' } },
    { kind: 'dome', x: 0, z: -1, id: 'dome', p: { r: 7.5 } },
    { kind: 'runes', x: 0, z: -3.5, id: 'runes', p: { n: 6 } },
    // lecterns
    { kind: 'lectern', x: -5, z: 2.5, id: 'rune-lectern', p: { text: 'RUNES|HTML', color: 0xffd98a }, solid: { w: 1.3, d: 0.9 } },
    { kind: 'lectern', x: 5, z: 2.5, id: 'ward-lectern', p: { text: 'WARDS|CSS', color: 0x5ee6d0 }, solid: { w: 1.3, d: 0.9 } },
    { kind: 'bookshelf', x: -12.4, z: -3, ry: Math.PI / 2, p: { w: 5 }, solid: { w: 0.5, d: 5 } }, { kind: 'bookshelf', x: 12.4, z: -3, ry: -Math.PI / 2, p: { w: 5 }, solid: { w: 0.5, d: 5 } },
    { kind: 'desk', x: -9, z: 5, solid: { w: 1.6, d: 0.8 } }, { kind: 'desk', x: -7, z: 6.4, solid: { w: 1.6, d: 0.8 } }, { kind: 'desk', x: 9, z: 5, solid: { w: 1.6, d: 0.8 } }, { kind: 'desk', x: 7, z: 6.4, solid: { w: 1.6, d: 0.8 } },
    { kind: 'lantern', x: -11.5, z: 7.5, p: { h: 2.6 } }, { kind: 'lantern', x: 11.5, z: 7.5, p: { h: 2.6 } }, { kind: 'lantern', x: -11.5, z: -8.5, p: { h: 2.6 } }, { kind: 'lantern', x: 11.5, z: -8.5, p: { h: 2.6 } },
  ],
  npcs: [{ npc: 'bram', x: 0, z: 3.2, ry: 0.2 }],
  interactables: [
    { id: 'talk-bram', verb: 'Talk', label: 'Tutor Bram', x: 0, z: 3.2, action: { type: 'talk', npc: 'bram' } },
    { id: 'rune-lectern', verb: 'Use', label: 'the Rune Lectern', x: -5, z: 3.7, action: { type: 'terminal', station: 'rune-lectern' } },
    { id: 'ward-lectern', verb: 'Use', label: 'the Ward Lectern', x: 5, z: 3.7, action: { type: 'terminal', station: 'ward-lectern' } },
    { id: 'hall-look', verb: 'Inspect', label: 'the ward dome', x: 0, z: -1, range: 3.6, action: { type: 'inspect', id: 'hall-dome', text: 'Above the hall, a great dome of ward-light should stand: coloured, thick and whole. Right now it is barely a shimmer.', after: { effect: 'ward.dome:color', text: 'The dome shows its colour. Every change you make at the Ward Lectern shows here, at once.' } } },
  ],
  exits: [{ id: 'to-courtyard', label: 'the courtyard', x: 0, z: 8.2, to: 'lantern-courtyard', spawn: 'from-hall' }],
  reactions: [
    { prop: 'banner', effect: 'hall.banner:unfurl', state: 'unfurl', say: 'The academy banner unfurls from the ceiling: your first rune holds.', cinematic: 'acad-banner' },
    { prop: 'portal', effect: 'hall.portal:frame', state: 'frame', say: 'Stones rise from the floor and frame a portal.', cinematic: 'acad-portal-frame' },
    { prop: 'portal', effect: 'hall.portal:open', state: 'open', say: 'The portal opens, swirling with light. Your form worked.', cinematic: 'acad-portal-open' },
    { prop: 'crest', effect: 'hall.crest:shine', state: 'on', say: 'The Trial of Runes is passed. The crest shines.', cinematic: 'acad-crest' },
    { prop: 'dome', effect: 'ward.dome:color', state: 'color', say: 'A dome of ward-light rises over the hall, in the colour you chose.', cinematic: 'acad-dome-color' },
    { prop: 'dome', effect: 'ward.dome:thick', state: 'thick', say: 'The ward thickens. Padding and borders hold it together.', cinematic: 'acad-dome-thick' },
    { prop: 'runes', effect: 'ward.runes:align', state: 'align', say: 'The glyphs slide into a neat row: flexbox.', cinematic: 'acad-runes-align' },
    { prop: 'runes', effect: 'ward.runes:grid', state: 'grid', say: 'The glyphs settle into a grid.', cinematic: 'acad-runes-grid' },
    { prop: 'dome', effect: 'ward.dome:adapt', state: 'adapt', say: 'The dome now fits the hall however it is shaped.', cinematic: 'acad-dome-adapt' },
    { prop: 'dome', effect: 'ward.dome:aegis', state: 'aegis', say: 'The Aegis: a complete ward, teal and whole. The Style Studio trial is yours.', cinematic: 'acad-dome-aegis' },
  ],
  consequences: [
    { prop: 'portal', station: 'rune-lectern', play: 'malfunction', say: 'The runes do not hold: the hall flickers. Something you wrote says less, or something else, than you meant.' },
    { prop: 'dome', station: 'ward-lectern', play: 'malfunction', say: 'The ward stutters and snaps back: a style that did not do what you needed. Look at what it did.' },
  ],
};
