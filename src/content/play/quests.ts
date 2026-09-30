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
  {
    id: 'q-lantern-briefing', title: 'The Lanterns Are Going Out', giver: 'Warden Teselle',
    summary: 'One by one the academy’s lanterns have failed. The Warden thinks the old rune-work is unsound. Look at a dead lantern, then write the first runes in the Runecraft Hall.',
    objectives: [
      { id: 'l1', text: 'Talk to Warden Teselle in the courtyard', kind: 'talk', ref: 'teselle' },
      { id: 'l2', text: 'Inspect the dark lantern by the pond', kind: 'inspect', ref: 'dark-lantern' },
      { id: 'l3', text: 'Write a rune at the Rune Lectern: unfurl the academy banner', kind: 'effect', ref: 'hall.banner:unfurl' },
      { id: 'l4', text: 'Write the links and lists that raise a portal frame', kind: 'effect', ref: 'hall.portal:frame' },
    ],
    reward: { xp: 90, coins: 30 },
  },
  {
    id: 'q-lantern-wards', title: 'Raise the Wards', giver: 'Tutor Bram', requires: 'q-lantern-briefing',
    summary: 'Runes give things meaning; wards give them form. Tutor Bram wants the old dome raised again: colour it, thicken it, line up its glyphs and let it fit any hall.',
    objectives: [
      { id: 'w1', text: 'Open the portal with a form that works', kind: 'effect', ref: 'hall.portal:open' },
      { id: 'w2', text: 'Colour the ward dome (selectors)', kind: 'effect', ref: 'ward.dome:color' },
      { id: 'w3', text: 'Thicken the dome (the box model)', kind: 'effect', ref: 'ward.dome:thick' },
      { id: 'w4', text: 'Line up the glyphs (flexbox)', kind: 'effect', ref: 'ward.runes:align' },
      { id: 'w5', text: 'Let the dome fit any hall (responsive design)', kind: 'effect', ref: 'ward.dome:adapt' },
    ],
    reward: { xp: 130, coins: 40 },
  },
  {
    id: 'q-lantern-duel', title: 'The Gloomhound', giver: 'Apprentice Nim', requires: 'q-lantern-wards',
    summary: 'Something has crept into the Dueling Ring and is eating the light. Nim says it only fears incantations that really work. Cast them at the lectern.',
    objectives: [
      { id: 'h1', text: 'Wake the altar orb with your first incantation', kind: 'effect', ref: 'arena.orb:spark' },
      { id: 'h2', text: 'Strike the Gloomhound with a spell built from data', kind: 'effect', ref: 'arena.hound:hit1' },
      { id: 'h3', text: 'Relight the arena lanterns by changing the page (the DOM)', kind: 'effect', ref: 'arena.lanterns:light' },
      { id: 'h4', text: 'Strike again with a spell that answers a click (events)', kind: 'effect', ref: 'arena.hound:hit2' },
      { id: 'h5', text: 'Finish the trial: drive the Gloomhound out', kind: 'effect', ref: 'arena.hound:defeat' },
    ],
    reward: { xp: 200, coins: 70, items: ['lantern-charm'] },
  },
  {
    id: 'q-park-numbers', title: 'Scout the Numbers', giver: 'Analyst Dara',
    summary: 'Harborview Park has a season of data and a manager who picks his lineup by jersey number. Load the roster, rank the hitters and clean the missing data.',
    objectives: [
      { id: 'n1', text: 'Talk to Analyst Dara in the Analytics Office', kind: 'talk', ref: 'dara' },
      { id: 'n2', text: 'Ask the database for the roster', kind: 'effect', ref: 'office.roster:load' },
      { id: 'n3', text: 'Rank the hitters', kind: 'effect', ref: 'office.ranking:sort' },
      { id: 'n4', text: 'Deal with the missing values', kind: 'effect', ref: 'office.roster:clean' },
    ],
    reward: { xp: 90, coins: 30 },
  },
  {
    id: 'q-park-lineup', title: 'Fill Out the Lineup Card', giver: 'Coach Reyes', requires: 'q-park-numbers',
    summary: 'Coach Reyes will send out whatever lineup you can justify with data. Summarise, group by position, join the tables, and then win a game with the lineup you built.',
    objectives: [
      { id: 'p1', text: 'Summarise the season with aggregates', kind: 'effect', ref: 'office.stats:summarise' },
      { id: 'p2', text: 'Group the players by position', kind: 'effect', ref: 'office.positions:group' },
      { id: 'p3', text: 'Join players to their stats and set the lineup', kind: 'effect', ref: 'field.lineup:set' },
      { id: 'p4', text: 'Win a game at Harborview Park with your lineup', kind: 'inspect', ref: 'sim-win' },
    ],
    reward: { xp: 180, coins: 60, items: ['pennant'] },
  },
  {
    id: 'q-race-setup', title: 'Telemetry Does Not Lie', giver: 'Crew Chief Marisol',
    summary: 'The car slides in the corners and locks its brakes. Marisol says the telemetry already explains why: learn to read it in a spreadsheet, fix the setup, and drive the difference.',
    objectives: [
      { id: 'c1', text: 'Talk to Crew Chief Marisol in the garage', kind: 'talk', ref: 'marisol' },
      { id: 'c2', text: 'Work out the tyre pressures with formulas', kind: 'effect', ref: 'garage.car:tyres' },
      { id: 'c3', text: 'Fix the brake balance with functions', kind: 'effect', ref: 'garage.car:brakes' },
      { id: 'c4', text: 'Drive a lap of the Redline circuit', kind: 'inspect', ref: 'lap-done' },
    ],
    reward: { xp: 120, coins: 40 },
  },
  {
    id: 'q-race-fast', title: 'Find the Lap Time', giver: 'Crew Chief Marisol', requires: 'q-race-setup',
    summary: 'Fuel load and aerodynamics are the last two systems. Fix them, then beat the crew chief’s par lap with the car you set up yourself.',
    objectives: [
      { id: 'f1', text: 'Decide the fuel strategy with logic', kind: 'effect', ref: 'garage.car:fuel' },
      { id: 'f2', text: 'Look up the aero package from the tables', kind: 'effect', ref: 'garage.car:aero' },
      { id: 'f3', text: 'Beat the par lap time', kind: 'inspect', ref: 'lap-par' },
    ],
    reward: { xp: 180, coins: 60, items: ['checkered-flag'] },
  },
];
