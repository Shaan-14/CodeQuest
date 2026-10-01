import type { SceneDef } from '../../../play/logic/sceneTypes';
import { room } from './kit';

/** THE GARAGE (Redline Raceway): the car on its lift, the telemetry console, the crew chief. What the spreadsheet work changes here is what the car does on the track. */
export const garage: SceneDef = {
  id: 'garage', world: 'racing', title: 'Redline Garage', blurb: 'Your car is on the lift. The telemetry console knows why it slides.',
  bounds: { minX: -13, maxX: 13, minZ: -9, maxZ: 9 },
  spawns: { default: { x: 0, z: 7, ry: 0 }, 'from-plaza': { x: 0, z: 7, ry: 0 }, 'from-track': { x: 11, z: 0, ry: Math.PI / 2 * -1 } },
  look: { sky: 0x1a1c26, fog: 0x1a1c26, fogNear: 24, fogFar: 56, ground: 0x2a2d3a, ambient: 0.65, sun: 0.9 },
  ambience: 'engine',
  props: [
    { kind: 'floor', x: 0, z: 0, p: { w: 26, d: 18, color: 0x3a3e4e, color2: 0x444859, tile: 2 } },
    ...room(-13, 13, -9, 9, { h: 5, color: 0x4b5068, trim: 0xe63946, gaps: { south: [0, 3.4], east: [0, 4] } }),
    { kind: 'archway', x: 0, z: 8.6, ry: Math.PI, p: { w: 3.4, h: 3.4, text: 'PLAZA', color: 0xffd166, portal: false } },
    { kind: 'archway', x: 12.6, z: 0, ry: -Math.PI / 2, p: { w: 4, h: 3.6, text: 'TRACK', color: 0xe63946, portal: false } },
    { kind: 'liftStand', x: 0, z: -2, solid: { w: 3, d: 5.4, h: 0.3 } },
    { kind: 'car', x: 0, z: -2, y: 0.9, id: 'car', p: { number: '7' } },
    { kind: 'console', x: -8, z: -7.6, id: 'telemetry-console', p: { text: 'TELEMETRY|> =FORMULA_', color: 0xe63946 }, solid: { w: 1.7, d: 0.9 } },
    { kind: 'statusScreen', x: 0, z: -8.6, p: { w: 7, h: 2.4, y: 1.8, off: 'LAP TELEMETRY|tyre temps: ???|brake temps: ???|fuel: ???', on: 'LAP TELEMETRY', fg: '#ff8c8c', bg: '#1a0d0d' } },
    { kind: 'tyreRack', x: -12, z: 3, ry: Math.PI / 2, solid: { w: 0.4, d: 2.4 } }, { kind: 'tyreRack', x: -12, z: 6, ry: Math.PI / 2, solid: { w: 0.4, d: 2.4 } },
    { kind: 'toolrack', x: 8, z: -8.7, ry: 0 }, { kind: 'workbench', x: 9, z: 4, ry: Math.PI / 2, solid: { w: 0.9, d: 2.2, h: 1 } },
    { kind: 'barrel', x: 11, z: 7, p: { color: 0xe63946 }, solid: { w: 0.7, d: 0.7 } },
    { kind: 'lamppost', x: -12, z: -8, p: { h: 2.8, color: 0xffb3b3 } }, { kind: 'lamppost', x: 12, z: -8, p: { h: 2.8, color: 0xffb3b3 } },
  ],
  npcs: [{ npc: 'marisol', x: 4.4, z: -1.2, ry: -1.0 }],
  interactables: [
    { id: 'talk-marisol', verb: 'Talk', label: 'Crew Chief Marisol', x: 4.4, z: -1.2, action: { type: 'talk', npc: 'marisol' } },
    { id: 'telemetry-console', verb: 'Use', label: 'the Telemetry Console', x: -8, z: -6.3, range: 2.2, action: { type: 'terminal', station: 'telemetry-console' } },
    { id: 'drive-car', verb: 'Drive', label: 'the car', x: 0, z: 1.5, range: 3.2, action: { type: 'vehicle', vehicle: 'car' } },
    { id: 'car-look', verb: 'Inspect', label: 'the car', x: -2.4, z: -2, range: 2.4, action: { type: 'inspect', id: 'car-look', text: 'The car sits low on its lift. The tyres are a hard compound, run at whatever pressure someone guessed. The brake discs are unmatched and the fuel load is a round number nobody calculated. On the track it slides in every corner and the front brakes lock under braking. None of that is bad luck: it is all in the telemetry.', after: { effect: 'garage.car:tyres', text: 'The tyres wear the pressures your spreadsheet found; the car grips where it used to slide.' } } },
  ],
  exits: [
    { id: 'to-plaza', label: 'Bytehaven Plaza', x: 0, z: 8, to: 'plaza', spawn: 'from-racing' },
    { id: 'to-track', label: 'the paddock and track', x: 12, z: 0, to: 'track', spawn: 'paddock' },
  ],
  reactions: [
    { prop: 'car', effect: 'garage.car:tyres', state: 'tyres', say: '', cinematic: 'car-tyres' }, { prop: 'car', effect: 'garage.car:brakes', state: 'brakes', say: '', cinematic: 'car-brakes' },
    { prop: 'car', effect: 'garage.car:fuel', state: 'fuel', say: '', cinematic: 'car-fuel' }, { prop: 'car', effect: 'garage.car:aero', state: 'aero', say: '', cinematic: 'car-aero' },
  ],
  consequences: [{ prop: 'car', station: 'telemetry-console', play: 'malfunction', say: 'The telemetry reading was wrong: the pit crew fit the wrong pressures and the car smokes on the lift. No harm done; read the data again.' }],
};
