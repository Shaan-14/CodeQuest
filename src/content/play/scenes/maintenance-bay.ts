import type { SceneDef } from '../../../play/logic/sceneTypes';
import { C, room, stripe } from './kit';

/**
 * MAINTENANCE BAY (Robotics Academy). Bolt-7 lies on the repair table; the console on the north wall holds his control program as thirteen
 * lessons. Every lesson finished changes something on the table (see content/play/effects.ts).
 */
export const maintenanceBay: SceneDef = {
  id: 'maintenance-bay', world: 'robotics', title: 'Maintenance Bay', blurb: 'Bolt-7 lies on the repair table. The console on the north wall holds his control program.',
  bounds: { minX: -12, maxX: 12, minZ: -9, maxZ: 9 },
  spawns: { default: { x: 0, z: 7, ry: 0 }, door: { x: 0, z: 7, ry: 0 } },
  look: { sky: 0x1b2340, fog: 0x1b2340, fogNear: 28, fogFar: 64, ground: 0x2c3352, ambient: 0.55, sun: 1.0, sunDir: [0.3, 1, 0.5] },
  ambience: 'workshop',
  zones: [{ id: 'bay', label: 'Repair table', x: -4, z: -3, w: 5, d: 4 }, { id: 'consoles', label: 'Consoles', x: 1, z: -7, w: 6, d: 2 }],
  props: [
    { kind: 'floor', x: 0, z: 0, p: { w: 24, d: 18, color: 0x55607f, color2: 0x5f6b8c, tile: 2 } },
    ...room(-12, 12, -9, 9, { h: 4.2, gaps: { south: [0, 3] } }),
    // doorway (south) and its frame
    { kind: 'door', x: 0, z: 9, id: 'door-south', p: { w: 3, h: 3.2 } },
    // warning stripes around the repair area
    stripe(-4, -3, 6.4, 0.3), stripe(-4, 0.1, 6.4, 0.3), stripe(-7.05, -1.45, 0.3, 3.4), stripe(-0.95, -1.45, 0.3, 3.4),
    // the repair table and Bolt-7
    { kind: 'box', x: -4, z: -3, p: { w: 3.6, h: 0.9, d: 1.5, color: 0x39405c }, solid: { w: 3.6, d: 1.5, h: 0.9 } },
    { kind: 'box', x: -4, z: -3, y: 0.9, p: { w: 3.8, h: 0.1, d: 1.7, color: 0x8892b0 } },
    { kind: 'bolt', x: -4, z: -3, id: 'bolt', p: { table: 1.0, outZ: 2.2, scale: 1.3 } },
    // console bank, north wall
    { kind: 'console', x: 1.5, z: -7.6, id: 'bolt-console', p: { text: 'BOLT-7|CONTROL PROGRAM|> module_', color: C.green }, solid: { w: 1.7, d: 0.9 } },
    { kind: 'screen', x: 6.5, z: -8.7, p: { w: 4.5, h: 1.8, y: 1.6, text: 'MAINTENANCE BAY|UNIT: BOLT-7|STATUS: SHUTDOWN|CAUSE: POWER SURGE', fg: '#ff9f1c', bg: '#20140a' } },
    { kind: 'sign', x: -4, z: -8.7, p: { w: 4, h: 0.8, text: 'MAINTENANCE BAY', fg: '#ffd166', bg: '#1b1b2f', post: 2.2 } },
    // workbenches, tools, crates
    { kind: 'workbench', x: 9, z: -5, ry: Math.PI / 2, solid: { w: 0.9, d: 2.2, h: 1 } },
    { kind: 'toolrack', x: 11.7, z: 0, ry: -Math.PI / 2 },
    { kind: 'crate', x: 10, z: 5, p: { w: 1.1 }, solid: { w: 1.1, d: 1.1 } }, { kind: 'crate', x: 10, z: 6.3, p: { w: 0.9, color: 0x9c6b2f }, solid: { w: 0.9, d: 0.9 } },
    { kind: 'barrel', x: -10, z: 6, solid: { w: 0.7, d: 0.7 } }, { kind: 'barrel', x: -10.9, z: 5.2, p: { color: 0xc2603a }, solid: { w: 0.7, d: 0.7 } },
    { kind: 'hologram', x: -10, z: 2.6, solid: { w: 1.4, d: 1.4 } },
    // the repair rig beside the table: it fetches, carries and welds Bolt's arm back on when the player's fault log is fixed
    { kind: 'repairrig', x: -8.6, z: -3.6, id: 'repair-rig', p: { target: 'bolt' }, solid: { w: 2.2, d: 2.2 } },
    { kind: 'arm', x: 6.5, z: 3, id: 'bay-arm', solid: { w: 1.1, d: 1.1 } },
    { kind: 'lamppost', x: -11, z: -8, p: { h: 2.6, color: 0xffe9a8 } }, { kind: 'lamppost', x: 11, z: -8, p: { h: 2.6, color: 0xffe9a8 } },
    { kind: 'dummy', x: 7.5, z: 6.5, solid: { w: 0.9, d: 0.9 } },
  ],
  npcs: [{ npc: 'juno', x: 3, z: 1.5, ry: -0.6 }, { npc: 'rowan', x: -8, z: -1, ry: 1.2, activity: 'work' }],
  interactables: [
    { id: 'talk-juno', verb: 'Talk', label: 'Mentor Juno', x: 3, z: 1.5, action: { type: 'talk', npc: 'juno' } },
    { id: 'talk-rowan', verb: 'Talk', label: 'Technician Rowan', x: -8, z: -1, action: { type: 'talk', npc: 'rowan' } },
    { id: 'bolt-table', verb: 'Inspect', label: 'Bolt-7', x: -4, z: -1.3, range: 2.4, action: {
      type: 'inspect', id: 'bolt-table',
      text: 'Bolt-7 lies on his back. His chest panel is scorched and dark, his eyes are dead glass, and his right arm has come off at the shoulder: it lies beside him with its wires hanging. A slot where his battery cell should be is empty. Whatever did this did it to his control program too.',
      after: { effect: 'bay.bolt:awake', text: 'Bolt-7 stands where the table used to hold him, eyes green, one arm raised in a wave. Every module on his console is yours.' },
    } },
    { id: 'bolt-console', verb: 'Use', label: 'Bolt-7 Repair Console', x: 1.5, z: -6.4, range: 2.2, action: { type: 'terminal', station: 'bolt-console' } },
    { id: 'hologram-info', verb: 'Inspect', label: 'Hologram table', x: -10, z: 1.0, action: { type: 'inspect', id: 'holo-bay', text: 'The hologram shows a slowly turning diagram of a robot’s control loop: sense, decide, act, repeat. A note underneath: “A program is just a robot’s way of deciding what to do next.”' } },
  ],
  exits: [{ id: 'to-atrium', label: 'the Robotics Academy atrium', x: 0, z: 8.2, to: 'robotics-atrium', spawn: 'from-bay' }],
  reactions: [
    { prop: 'bolt', effect: 'bay.bolt:eyes', state: 'eyes', say: 'Bolt-7’s display flickers on. His eyes glow blue.', cinematic: 'bolt-eyes' },
    { prop: 'bolt', effect: 'bay.bolt:arm', state: 'arm', say: 'The arm snaps back onto Bolt-7’s shoulder with a shower of sparks.', cinematic: 'bolt-arm' },
    { prop: 'bolt', effect: 'bay.bolt:power', state: 'power', say: 'The battery cell glows green. Bolt-7 holds a charge.', cinematic: 'bolt-power' },
    { prop: 'bolt', effect: 'bay.bolt:voice', state: 'voice', cinematic: 'bolt-voice' },
    { prop: 'bolt', effect: 'bay.bolt:servo', state: 'servo', say: 'Bolt-7’s head servo calibrates: a smooth nod.', cinematic: 'bolt-servo' },
    { prop: 'bolt', effect: 'bay.bolt:ears', state: 'ears', say: 'The antenna on Bolt-7’s head lights up: he is listening.', cinematic: 'bolt-ears' },
    { prop: 'bolt', effect: 'bay.bolt:decide', state: 'decide', cinematic: 'bolt-decide' },
    { prop: 'bolt', effect: 'bay.bolt:senses', state: 'senses', say: 'Bolt-7’s visor sweeps the room and turns amber: he is making choices.', cinematic: 'bolt-senses' },
    { prop: 'bolt', effect: 'bay.bolt:cycle', state: 'cycle', say: 'Bolt-7 repeats a motion until told to stop.', cinematic: 'bolt-cycle' },
    { prop: 'bolt', effect: 'bay.bolt:loop', state: 'loop', say: 'Bolt-7 nods in a steady count: a loop running exactly as many times as you said.', cinematic: 'bolt-loop' },
    { prop: 'bolt', effect: 'bay.bolt:routine', state: 'routine', say: 'Bolt-7 performs the routine you wrote, arms swinging.', cinematic: 'bolt-routine' },
    { prop: 'bolt', effect: 'bay.bolt:awake', state: 'awake', say: 'Your control program runs. Bolt-7 sits up… and stands.', cinematic: 'bolt-awake' },
  ],
  consequences: [
    { prop: 'bolt', station: 'bolt-console', play: 'malfunction', cinematic: 'bolt-fail', say: 'Bolt-7 convulses: sparks, smoke, eyes flashing red. The program did not do what the robot needed. Nothing is lost; look at what went wrong.' },
  ],
};
