import type { Npc3D } from '../../play/logic/dialogue';

/**
 * THE CAST of the playable world. Each person has a role in a place, a personality and dialogue that follows the player's story: the first
 * entry whose condition holds is what they say. Nobody hands out answers; they point at how to THINK about a problem.
 */
const ROBOTICS: Npc3D[] = [
  {
    id: 'juno', icon: '🧑‍🏫', name: 'Mentor Juno', role: 'Head of the Robotics Academy',
    personality: 'Calm, dry-humoured, patient. Asks questions back. Believes engineers look before they touch.',
    look: { body: 0xe8ecf7, head: 0xf2c9a0, accent: 0x2f9e8f, hair: 0xb8c0d8, hat: 'none' },
    dialogue: [
      { when: { quest: { id: 'q-bay-awaken', status: ['completed'] } }, mood: 'cheer', lines: ['Bolt-7 is walking the bay again, and every line of his control program is yours. I have seen people quit on a robot like that.', 'Ori on the Manufacturing Floor has been asking for someone who can write control programs. The line went down with the surge too.'] },
      { when: { effect: 'bay.bolt:awake', quest: { id: 'q-bay-awaken', status: ['accepted', 'in-progress'] } }, marks: 'juno-debrief', mood: 'cheer', lines: ['He stood up. On your code.', 'Tell me honestly: what did you change that made the difference, and how did you know it would work?', 'Hold on to that answer. It is the real skill: not the program, but knowing why it works.'] },
      { when: { quest: { id: 'q-bay-brain', status: ['completed'] }, notEffect: 'bay.bolt:awake' }, lines: ['Decisions, loops, routines: Bolt can think in a straight line now. Rowan has the final stage. You are close.'] },
      { when: { quest: { id: 'q-bay-brain', status: ['available'] } }, offer: 'q-bay-brain', lines: ['His arm is back and he can talk. But a robot that only follows one path will walk into a wall.', 'Give him numbers, hearing, decisions and loops, so he can react to what is around him. The console has the next modules.'] },
      { when: { quest: { id: 'q-bay-brain', status: ['accepted', 'in-progress'] } }, lines: ['One module at a time. When something does not work, do not change five things. Change one, run it, and read what comes back.'] },
      { when: { quest: { id: 'q-bay-repair', status: ['accepted', 'in-progress', 'available'] } }, lines: ['Rowan knows this table better than I do. Ask him what is wrong with Bolt before you touch the console.'] },
      { when: { quest: { id: 'q-bay-briefing', status: ['accepted', 'in-progress'] }, notSeen: 'bolt-table' }, lines: ['Before you touch the console, go and look at Bolt on the table. Engineers look first.'] },
      { when: { quest: { id: 'q-bay-briefing', status: ['accepted', 'in-progress'] }, seen: 'bolt-table' }, lines: ['You have seen what a power surge does to a robot. The console on the north wall can rebuild his control program. Start with the first module: your first program.'] },
      { when: { quest: { id: 'q-bay-briefing', status: ['completed'] } }, lines: ['Bolt’s display is on. That was your program. Rowan will tell you what comes next.'] },
      { when: { quest: { id: 'q-bay-briefing', status: ['available'] } }, offer: 'q-bay-briefing', mood: 'worry', lines: ['Welcome to the Maintenance Bay. This is where robots come when they break, and where engineers learn what a program really does.', 'Bolt-7 was our best training robot until last night’s power surge fried his control program. He has been lying there since.', 'The console can rebuild his program, one module at a time. Every module you finish will change something on that table. Will you help?'] },
      { lines: ['Take your time. Look before you touch.'] },
    ],
  },
  {
    id: 'rowan', icon: '🧑‍🔧', name: 'Technician Rowan', role: 'Maintenance technician',
    personality: 'Hands-on, cheerful, a little messy. Talks to the robots. Treats every error message as a friendly hint.',
    look: { body: 0xd98a2b, head: 0xd9a877, accent: 0xf2c14e, hair: 0x3a2a1a, hat: 'hardhat' },
    dialogue: [
      { when: { quest: { id: 'q-bay-awaken', status: ['completed'] } }, mood: 'cheer', lines: ['Look at him go! I have been fixing robots for eleven years and I still get a lump in my throat.'] },
      { when: { quest: { id: 'q-bay-awaken', status: ['available'] } }, offer: 'q-bay-awaken', lines: ['He is almost whole. A reusable routine for the arm, and then the big one: his complete control program.', 'Everything you have written so far is a piece of it. Put it together, and watch that chassis.'] },
      { when: { quest: { id: 'q-bay-awaken', status: ['accepted', 'in-progress'] } }, lines: ['The routine first: something you can call again and again. Then the whole program. You know how to read an error by now.'] },
      { when: { quest: { id: 'q-bay-repair', status: ['accepted', 'in-progress'] } }, lines: ['Error messages are not insults, they are directions. “Line 3, NameError”: the machine is telling you exactly where to look.', 'Fault log for the arm. A variable for the battery. Then his voice.'] },
      { when: { quest: { id: 'q-bay-repair', status: ['available'] } }, offer: 'q-bay-repair', lines: ['Display is on, eh? That is a start. I am Rowan. I keep this bay running.', 'His right arm is off, his battery cell is empty and he cannot talk. Every one of those is a program problem, not a hardware problem.', 'Want to work through them?'] },
      { when: { quest: { id: 'q-bay-briefing', status: ['available', 'accepted', 'in-progress'] } }, lines: ['Morning. Mind the cables. Juno wants you to look at Bolt before you do anything else.'] },
      { lines: ['Mind the cables.'] },
    ],
  },
  {
    id: 'ori-floor', icon: '🛠️', name: 'Engineer Ori', role: 'Line engineer, Manufacturing Floor',
    personality: 'Brisk, practical, allergic to guesswork. Judges a program by its worst night.',
    look: { body: 0x2b6cb0, head: 0xc99267, accent: 0xff9f1c, hair: 0x1f1a1a, hat: 'cap' },
    dialogue: [
      { when: { quest: { id: 'q-floor-logs', status: ['completed'] } }, mood: 'cheer', lines: ['Dashboard is lit, line is steady, logs are readable. You kept a production line alive.', 'Whoever taught you to test your own code: buy them a coffee.'] },
      { when: { quest: { id: 'q-floor-logs', status: ['available'] } }, offer: 'q-floor-logs', lines: ['It runs. Good. It also jams every forty minutes and nobody knows why.', 'The answer is in the logs. Design your functions so you can trust them, find the bug, read the files, clean the data.'] },
      { when: { quest: { id: 'q-floor-logs', status: ['accepted', 'in-progress'] } }, lines: ['Shrink the problem. One part, one log line, one function. A bug you cannot reproduce is a bug you cannot fix.'] },
      { when: { quest: { id: 'q-floor-line', status: ['accepted', 'in-progress'] } }, lines: ['Gate first, then the belt, then the arm. The controller is at the far end of the line.'] },
      { when: { quest: { id: 'q-floor-line', status: ['available'] } }, offer: 'q-floor-line', lines: ['So you are the one who woke Bolt-7. Good. I need that.', 'The surge killed my whole line: the gate, the belt, the arm, the scanner. The controller accepts programs, and no one else here writes them.', 'There is an independent trial on the gate panel first: no hints, nothing spelled out. Can you do that?'] },
      { when: { quest: { id: 'q-bay-awaken', status: ['completed'] } }, lines: ['Afternoon. Mind the belt.'] },
      { lines: ['Line is down. Come back when Juno says you are ready.'] },
    ],
  },
  {
    id: 'sana-sim', icon: '🔎', name: 'Analyst Sana', role: 'Simulation coordinator',
    personality: 'Methodical and kind. Believes every failure is data. Always asks: what did you expect to happen?',
    look: { body: 0x2f9e8f, head: 0xd9a877, accent: 0xe9d8a6, hair: 0x2a1a12, hat: 'headband' },
    dialogue: [
      { when: { notEffect: 'never:ever' }, lines: ['This is the Simulation Room. When something breaks in the world, come here. A failure is a measurement, not a verdict.', 'The terminals here build a short training plan from exactly what went wrong. Work it through and your Focus comes back.'] },
    ],
  },
];

export const cast: Npc3D[] = [...ROBOTICS];
const byId = new Map(cast.map((n) => [n.id, n]));
export const getNpc3D = (id: string): Npc3D | undefined => byId.get(id);
