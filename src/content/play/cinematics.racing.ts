import type { Cinematic } from '../../play/logic/cinematic';

/**
 * RACING SEQUENCES: after a telemetry result changes the car, the driver gets in, the engine starts, the camera cuts to the circuit and the car
 * runs a real SECTION of the lap with the setup the player's work earned (the same physics and driver as the replay lap), then the timing board
 * shows the section time. Which section depends on the part that changed: tyres (the launch), aero (the fast sweeper), brakes (the hairpin),
 * fuel (the run out of the chicane). Only ever played after a pass.
 */
function run(id: string, o: { from: number; to: number; line: string; after: string }): Cinematic {
  return {
    id, len: 9.4,
    cues: [
      { t: 0, do: 'cam', at: { prop: 'paddock-car' }, dist: 8, yaw: 0.9, pitch: 0.18, height: 1.0, blend: 0.5 },
      { t: 0.2, do: 'player', walk: [-29.4, 108.3] },
      { t: 0.3, do: 'npc', id: 'marisol', look: { player: true }, mood: 'focused' },
      { t: 0.5, do: 'say', who: 'Crew Chief Marisol', text: o.line, for: 3 },
      { t: 1.9, do: 'player', face: { prop: 'paddock-car' }, anim: 'interact' },
      { t: 2.4, do: 'sfx', name: 'door' },
      { t: 2.5, do: 'player', show: false },
      // the engine starts
      { t: 2.7, do: 'sfx', name: 'power' },
      { t: 2.7, do: 'prop', id: 'paddock-car', play: 'rev' },
      { t: 2.8, do: 'fx', kind: 'smoke', at: { prop: 'paddock-car' }, n: 12, y: 0.5 },
      { t: 2.9, do: 'flash', at: { prop: 'paddock-car' }, color: 0xff7b00, power: 7, dur: 0.6, y: 0.8 },
      { t: 3.2, do: 'cam', at: { at: [-28, 90] }, dist: 12, yaw: 0.6, pitch: 0.15, height: 1.2, blend: 0.4 },
      // the run itself (the sheet's clock waits for it)
      { t: 3.4, do: 'lap', from: o.from, to: o.to, board: { id: 'timing-board', text: 'LAP TIMING|SECTION {t} s|YOUR SETUP' } },
      // the timing board, then back to the paddock
      { t: 3.6, do: 'cam', at: { prop: 'timing-board' }, dist: 15, yaw: Math.PI, pitch: 0.1, height: 3, blend: 0.8 },
      { t: 3.7, do: 'sfx', name: 'chime' },
      { t: 4.0, do: 'say', who: 'Crew Chief Marisol', text: o.after, for: 3.4 },
      { t: 6.3, do: 'cam', at: { prop: 'paddock-car' }, dist: 8, yaw: 0.9, pitch: 0.18, height: 1.0, blend: 0.8 },
      { t: 6.4, do: 'player', show: true, anim: 'cheer', mood: 'happy' },
      { t: 6.5, do: 'npc', id: 'marisol', anim: 'cheer', mood: 'happy' },
      { t: 8.0, do: 'cam', at: 'player', blend: 0.8 },
      { t: 8.4, do: 'npc', id: 'marisol', mood: 'neutral', look: null },
      { t: 8.5, do: 'player', mood: 'neutral' },
    ],
  };
}

export const RACING_SEQUENCES: Record<string, Cinematic> = {
  'run-tyres': run('run-tyres', { from: 0, to: 0.2, line: 'Fresh rubber at your pressures. Take her out and feel how it bites off the line.', after: 'Off the line, no wheelspin: that is the grip your spreadsheet found.' }),
  'run-aero': run('run-aero', { from: 0.12, to: 0.34, line: 'Bigger wings. Let us see how she takes the fast sweeper.', after: 'Flat through the sweeper. That trade of drag for grip was yours to make.' }),
  'run-brakes': run('run-brakes', { from: 0.34, to: 0.52, line: 'Balanced discs. Into the hairpin: brake late and see if she stays straight.', after: 'Straight and late. Equal work on both ends is worth tenths.' }),
  'run-fuel': run('run-fuel', { from: 0.6, to: 0.82, line: 'Just the fuel the numbers asked for. Watch her pull out of the chicane.', after: 'Lighter, so it pulls harder. You can see the weight you did not carry.' }),
};
