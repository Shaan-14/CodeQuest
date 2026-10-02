import type { Cinematic, Cue } from '../../play/logic/cinematic';

/**
 * BASEBALL SEQUENCES: the cutaway sheets (content/play/cutaways.ts) that show what a passed SQL lesson means on the field. Each one is a real
 * play, run by the park's players (engine/ballplay.ts): batter ready, the windup, the pitch, the swing, contact, the ball in flight, the
 * fielders, the runner, the crowd, the scoreboard. The play is chosen by the lesson's skill (hitting, a forecast, fielding, pitching, base
 * running) and it only ever plays after a PASS, so a failed query never shows a success.
 *
 * Timing is the engine's: windup 0 to 0.62 s after the play starts, release then, contact about 1.05 s in. The sheet starts the play at 0.3 s so the
 * first camera has already arrived.
 */
const W = (x: number, z: number): { at: [number, number] } => ({ at: [x, 6 + z] }); // local to home plate -> world (home is at z 6)
const START = 0.3;

interface Spec { id: string; play: string; len: number; flight: number; line: { who: string; text: string }; board: string; cheer?: 'big' | 'small'; shots?: Cue[] }

function seq(o: Spec): Cinematic {
  const contact = START + 1.05, done = contact + o.flight;
  const cues: Cue[] = [
    // batter ready, the pitcher's windup from the front
    { t: 0, do: 'cam', at: W(0, -9.4), dist: 4.8, yaw: 0.5, pitch: 0.14, height: 1.5, blend: 0.5 },
    { t: START, do: 'prop', id: 'team', play: o.play },
    // the swing from the batter's side, the contact, then the camera rides the ball
    { t: START + 0.55, do: 'cam', at: W(-0.4, 0), dist: 5, yaw: -1.2, pitch: 0.12, height: 1.3, blend: 0.4 },
    { t: contact, do: 'cam', at: { prop: 'team' }, follow: true, dist: 11, yaw: 0.25, pitch: 0.22, blend: 0.5 },
    // the field: fielders, the throw, the runner
    { t: done - 0.2, do: 'cam', at: W(0, -10), dist: 27, yaw: 0.35, pitch: 0.32, height: 1.5, blend: 0.9 },
    ...(o.cheer ? [{ t: done, do: 'sfx', name: 'cheer' } as Cue, { t: done, do: 'fx', kind: 'confetti', at: { at: [-9.5, 14] }, n: o.cheer === 'big' ? 36 : 16, y: 4 } as Cue, { t: done, do: 'fx', kind: 'confetti', at: { at: [9.5, 14] }, n: o.cheer === 'big' ? 36 : 16, y: 4 } as Cue] : []),
    { t: done, do: 'npc', id: 'reyes', anim: o.cheer ? 'cheer' : 'nod', mood: 'happy', look: W(0, -6) },
    // the scoreboard updates from the play
    { t: done + 0.5, do: 'cam', at: { prop: 'scoreboard' }, dist: 24, yaw: 0, pitch: 0.12, height: 5, blend: 0.9 },
    { t: done + 0.8, do: 'prop', id: 'scoreboard', play: `text:${o.board}` },
    { t: done + 0.8, do: 'sfx', name: 'chime' },
    { t: done + 1.0, do: 'say', who: o.line.who, text: o.line.text, for: 3.4 },
    { t: o.len - 0.9, do: 'cam', at: 'player', blend: 0.9 },
    { t: o.len - 0.5, do: 'npc', id: 'reyes', mood: 'neutral', look: null },
    ...(o.shots ?? []),
  ];
  return { id: o.id, cues, len: o.len };
}

export const BASEBALL_SEQUENCES: Record<string, Cinematic> = {
  // hitting: a single, the first hitter on the loaded roster
  'seq-roster': seq({ id: 'seq-roster', play: 'seq:hit:1', len: 8.4, flight: 2.5, cheer: 'small', board: 'ROSTER LOADED|38 PLAYERS · 6 TEAMS|FIRST HIT OF THE DAY', line: { who: 'Coach Reyes', text: 'Thirty-eight names on the roster. Now we know who we can send up there.' } }),
  // an analytics prediction: the forecast arc is drawn on the grass first, and the ball lands on it
  'seq-ranking': seq({ id: 'seq-ranking', play: 'seq:predict:3', len: 10.6, flight: 4.4, cheer: 'small', board: 'FORECAST  DOUBLE|ACTUAL    DOUBLE|TOP OPS  IBARRA .912', line: { who: 'Analyst Dara', text: 'The ranking said a double to the gap, and the ball agreed. That is what sorting buys you.' },
    shots: [{ t: 0.05, do: 'cam', at: W(0, -2), dist: 20, yaw: 0.2, pitch: 0.3, height: 1.4, blend: 0.4 }, { t: 1.3, do: 'cam', at: W(0, -9.4), dist: 4.8, yaw: 0.5, pitch: 0.14, height: 1.5, blend: 0.6 }] }),
  // fielding: a ground ball, the throw, the out
  'seq-clean': seq({ id: 'seq-clean', play: 'seq:field:2', len: 8, flight: 2.0, board: 'OUT AT FIRST|3 PLAYERS FLAGGED|NO MISSING DATA GUESSED', line: { who: 'Coach Reyes', text: 'Missing numbers get flagged, not zeroed. Nobody is sent out on a guess.' } }),
  // pitching: the strikeout, from the mound
  'seq-stats': seq({ id: 'seq-stats', play: 'seq:pitch:0', len: 7, flight: 1.0, cheer: 'small', board: 'STRIKEOUT|SEASON  HR 184  AVG .271|RUNS 1,402', line: { who: 'Coach Reyes', text: 'A whole season in one line. Watch how he works a hitter.' } }),
  // base running: the steal
  'seq-positions': seq({ id: 'seq-positions', play: 'seq:steal', len: 8.2, flight: 2.5, cheer: 'small', board: 'STOLEN BASE|OF  .284  IF  .262|BY POSITION', line: { who: 'Coach Reyes', text: 'Grouped by position, you can see who is quick enough to take the extra base.' },
    shots: [{ t: START + 0.55, do: 'cam', at: W(8, -8), dist: 13, yaw: 1.0, pitch: 0.2, height: 1.3, blend: 0.5 }] }),
  // the lineup: a home run
  'seq-lineup': seq({ id: 'seq-lineup', play: 'seq:homerun:2', len: 10.8, flight: 4.6, cheer: 'big', board: 'HOME RUN|LINEUP SET BY DATA|NINE NAMES · NINE POSITIONS', line: { who: 'Coach Reyes', text: 'Nine names in the order the data chose. Take the field!' } }),
};
