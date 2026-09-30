import type { Quest } from '../schema';

/**
 * THE STORY QUESTS of the playable world. A story quest mixes steps done IN the world (talk, inspect) with steps done by CODE (an effect, which
 * exists only once a graded challenge was passed). No step can be completed by walking alone where code is needed, and none awards mastery:
 * finishing a quest pays the same XP/coins as any other and skill still comes only from evidence.
 */
export const playQuests: Quest[] = [
  {
    id: 'q-bay-briefing', title: 'Silent in the Bay', giver: 'Mentor Juno',
    summary: 'Bolt-7, the Academy’s best training robot, lies dead on the repair table after a power surge. Look him over, then boot his display from the console.',
    objectives: [
      { id: 'b1', text: 'Talk to Mentor Juno in the Maintenance Bay', kind: 'talk', ref: 'juno' },
      { id: 'b2', text: 'Inspect Bolt-7 on the repair table', kind: 'inspect', ref: 'bolt-table' },
      { id: 'b3', text: 'Write your first program at the console: boot Bolt-7’s display', kind: 'effect', ref: 'bay.bolt:eyes' },
    ],
    reward: { xp: 60, coins: 20 },
  },
  {
    id: 'q-bay-repair', title: 'Reconnect Bolt-7', giver: 'Technician Rowan', requires: 'q-bay-briefing',
    summary: 'Bolt’s display works, but his arm is off, his battery is empty and he cannot speak. Rowan says errors are how machines tell you what is wrong: learn to read them.',
    objectives: [
      { id: 'r1', text: 'Fix the fault log so Bolt’s arm reconnects', kind: 'effect', ref: 'bay.bolt:arm' },
      { id: 'r2', text: 'Give Bolt a memory so his battery holds charge', kind: 'effect', ref: 'bay.bolt:power' },
      { id: 'r3', text: 'Teach Bolt to speak', kind: 'effect', ref: 'bay.bolt:voice' },
    ],
    reward: { xp: 80, coins: 25 },
  },
  {
    id: 'q-bay-brain', title: 'Teach Bolt to Decide', giver: 'Mentor Juno', requires: 'q-bay-repair',
    summary: 'A robot that only follows one path walks into walls. Give Bolt numbers, hearing, decisions and loops so he can react to the world.',
    objectives: [
      { id: 'd1', text: 'Calibrate Bolt’s servos with numbers', kind: 'effect', ref: 'bay.bolt:servo' },
      { id: 'd2', text: 'Let Bolt listen', kind: 'effect', ref: 'bay.bolt:ears' },
      { id: 'd3', text: 'Teach Bolt yes and no', kind: 'effect', ref: 'bay.bolt:decide' },
      { id: 'd4', text: 'Give Bolt a choice to make', kind: 'effect', ref: 'bay.bolt:senses' },
      { id: 'd5', text: 'Make Bolt repeat a task', kind: 'effect', ref: 'bay.bolt:loop' },
    ],
    reward: { xp: 100, coins: 30 },
  },
  {
    id: 'q-bay-awaken', title: 'Bolt-7 Stands', giver: 'Technician Rowan', requires: 'q-bay-brain',
    summary: 'Everything Bolt needs is in place except his complete control program. Write it, and he stands up.',
    objectives: [
      { id: 'a1', text: 'Write Bolt’s reusable routine', kind: 'effect', ref: 'bay.bolt:routine' },
      { id: 'a2', text: 'Write Bolt’s complete control program', kind: 'effect', ref: 'bay.bolt:awake' },
      { id: 'a3', text: 'Tell Mentor Juno what you did', kind: 'inspect', ref: 'juno-debrief' },
    ],
    reward: { xp: 150, coins: 50 },
  },
  {
    id: 'q-floor-line', title: 'The Stalled Line', giver: 'Engineer Ori', requires: 'q-bay-awaken',
    summary: 'The Manufacturing Floor’s assembly line has been dead since the surge. Ori needs someone who can write control programs: bring the line back, part by part.',
    objectives: [
      { id: 'f1', text: 'Pass the independent trial to open the floor gate', kind: 'effect', ref: 'floor.gate:open' },
      { id: 'f2', text: 'Sort parts onto the belt with lists', kind: 'effect', ref: 'floor.belt:run' },
      { id: 'f3', text: 'Give the arm its part catalogue (dictionaries)', kind: 'effect', ref: 'floor.arm:run' },
      { id: 'f4', text: 'Bring the scanner online with records', kind: 'effect', ref: 'floor.scanner:online' },
    ],
    reward: { xp: 160, coins: 55 },
  },
  {
    id: 'q-floor-logs', title: 'Read the Machine’s Mind', giver: 'Engineer Ori', requires: 'q-floor-line',
    summary: 'The line runs, but something keeps jamming it. The answer is in the machine logs.',
    objectives: [
      { id: 'g1', text: 'Design reusable control functions', kind: 'effect', ref: 'floor.arm:precise' },
      { id: 'g2', text: 'Find and fix the jam bug', kind: 'effect', ref: 'floor.belt:repair' },
      { id: 'g3', text: 'Open the machine logs from files', kind: 'effect', ref: 'floor.logs:open' },
      { id: 'g4', text: 'Clean the log data for the plant dashboard', kind: 'effect', ref: 'floor.dashboard:light' },
    ],
    reward: { xp: 200, coins: 70 },
  },
];
