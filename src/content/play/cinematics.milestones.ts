import type { Cinematic, Cue } from '../../play/logic/cinematic';

/**
 * MILESTONES: when the player's work carries a whole district to its next stage (a quarter, half, three quarters and all of it restored, see
 * play/logic/restoration.ts), the place answers with a short moment of its own: the power comes up across everything nearby. They are written
 * against the PLAYER (never a prop), so they play in any scene of the district. Each district has its own cinematic language: Robotics is
 * heavy machinery waking from a low angle, the Park is a sweeping stadium shot, Lanternhollow is an orbit through rising light, the Raceway is
 * a tight, fast tracking shot. A milestone only presents: the power it raises is the restoration the player already earned.
 */
type World = 'robotics' | 'academy' | 'ballpark' | 'racing';
const STAGE_NAME = ['', 'is stirring', 'is running', 'is humming', 'is fully restored'];
const STAGE_SUB = ['', 'The first systems are answering again.', 'Half of it is working. The rest is waiting for you.', 'Nearly all of it is alive.', 'Everything here works again, and you made it work.'];

const NAME: Record<World, string> = { robotics: 'Robotics Academy', academy: 'Lanternhollow', ballpark: 'Harborview Park', racing: 'Redline Raceway' };
const COLOR: Record<World, number> = { robotics: 0x7dffb3, academy: 0xbd93f9, ballpark: 0x4fd1ff, racing: 0xff5d73 };
const SOUND: Record<World, 'servo' | 'spell' | 'crowd' | 'power'> = { robotics: 'servo', academy: 'spell', ballpark: 'crowd', racing: 'power' };
const FX: Record<World, 'sparks' | 'magic' | 'confetti' | 'smoke'> = { robotics: 'sparks', academy: 'magic', ballpark: 'confetti', racing: 'smoke' };
const LINE: Record<World, string[]> = {
  robotics: ['', 'A relay clicks over by the wall. Somewhere a motor takes a breath.', 'The line hums. Machines that have been still since the night of the outage are moving.', 'The Academy’s lights are almost all back. Engineers are looking up from their benches.', 'Every machine in the Academy is running on work you did.'],
  academy: ['', 'A lantern flickers somewhere above the pages. Then another.', 'The ink is moving on the walls again. The Hollow remembers how to be read.', 'The wards hum and the pages glow. It is almost a school again.', 'Every lantern, ward and page in Lanternhollow is lit.'],
  ballpark: ['', 'A floodlight stutters on over the outfield. The crowd that is not there yet cheers anyway.', 'The scoreboard finds its numbers. Half the park is alive.', 'The park is nearly full of light. Somebody is already warming up.', 'Harborview Park is lit from the first row to the last, and it runs on your analysis.'],
  racing: ['', 'A single pit light blinks green, and the garage ticks over.', 'The timing board counts again. The raceway has a pulse.', 'Engines are warming all along the pit lane.', 'The Raceway is whole. The board tells the truth, and so does your setup.'],
};

/** One camera idea per district, framed on the player, in beats (opening shot, the move, the reveal). */
const shots = (w: World, big: boolean): Cue[] => {
  const d = big ? 1.25 : 1;
  switch (w) {
    case 'robotics': return [ // heavy machinery: low, wide, pushing in, then craning up to take in the room
      { t: 0, do: 'cam', at: { player: true }, dist: 6.2 * d, yaw: 0.7, pitch: 0.06, height: 0.7, blend: 0.9, safe: true },
      { t: 1.4, do: 'cam', at: { player: true }, dist: 4.4 * d, yaw: 0.45, pitch: 0.12, height: 1.1, blend: 1.4, safe: true },
      { t: 2.8, do: 'cam', at: { player: true }, dist: 11 * d, yaw: -0.2, pitch: 0.55, height: 3.4, blend: 1.8, safe: true },
    ];
    case 'academy': return [ // a slow orbit through rising light
      { t: 0, do: 'cam', at: { player: true }, dist: 5 * d, yaw: -0.8, pitch: 0.2, height: 1.5, blend: 0.9, spin: 0.22, safe: true },
      { t: 2.6, do: 'cam', at: { player: true }, dist: 9 * d, yaw: 1.2, pitch: 0.4, height: 2.6, blend: 1.4, spin: 0.14, safe: true },
    ];
    case 'ballpark': return [ // a stadium sweep: far, high, drifting
      { t: 0, do: 'cam', at: { player: true }, dist: 14 * d, yaw: 0.2, pitch: 0.42, height: 4, blend: 0.9, spin: -0.1, safe: true },
      { t: 2.5, do: 'cam', at: { player: true }, dist: 7 * d, yaw: -0.5, pitch: 0.16, height: 1.4, blend: 1.4, safe: true },
    ];
    case 'racing': return [ // tight and quick: low side tracking, then a snap back
      { t: 0, do: 'cam', at: { player: true }, dist: 3.8 * d, yaw: 1.3, pitch: 0.08, height: 0.9, blend: 0.5, spin: -0.3, safe: true },
      { t: 1.8, do: 'cam', at: { player: true }, dist: 8 * d, yaw: -0.9, pitch: 0.2, height: 1.6, blend: 0.9, safe: true },
    ];
  }
};

function milestone(w: World, stage: 1 | 2 | 3 | 4): Cinematic {
  const big = stage >= 3, len = stage === 4 ? 8.4 : 6.6, name = NAME[w];
  return {
    id: `milestone:${w}:${stage}`, len,
    cues: [
      ...shots(w, big),
      { t: 0.2, do: 'sfx', name: 'surge' },
      { t: 0.3, do: 'power', k: 'save', over: stage === 4 ? 3 : 2.4 },
      { t: 0.5, do: 'flash', at: { player: true }, color: COLOR[w], power: 12 + stage * 2, dur: 1.2, y: 2.2 },
      { t: 0.9, do: 'fx', kind: FX[w], at: { player: true }, n: 14 + stage * 6, y: 2.4 },
      { t: 1.4, do: 'sfx', name: SOUND[w] },
      ...(stage >= 2 ? [{ t: 2.4, do: 'flash', at: { player: true }, color: 0xffffff, power: 10, dur: 0.6, y: 3.2 } as Cue] : []),
      ...(stage === 4 ? [{ t: 3.4, do: 'sfx', name: 'swell' } as Cue, { t: 3.5, do: 'fx', kind: 'confetti', at: { player: true }, n: 30, y: 3.5 } as Cue] : []),
      { t: 1.2, do: 'say', text: LINE[w][stage]!, for: 4.2 },
      { t: 2.2, do: 'banner', title: `${name} ${STAGE_NAME[stage]}`, sub: STAGE_SUB[stage], kind: 'info' },
      { t: len - 1.2, do: 'cam', at: 'player', blend: 1.3 },
    ],
  };
}

export const MILESTONES: Record<string, Cinematic> = {};
for (const w of ['robotics', 'academy', 'ballpark', 'racing'] as World[]) for (const st of [1, 2, 3, 4] as const) MILESTONES[`milestone:${w}:${st}`] = milestone(w, st);
