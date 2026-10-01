import type { Npc3D } from '../../play/logic/dialogue';

/**
 * THE CAST of the playable world. Each person has a role in a place, a personality and dialogue that follows the player's story: the first
 * entry whose condition holds is what they say. Nobody hands out answers; they point at how to THINK about a problem.
 */
const ROBOTICS: Npc3D[] = [
  {
    id: 'juno', icon: '🧑‍🏫', name: 'Mentor Juno', role: 'Head of the Robotics Academy',
    personality: 'Calm, dry-humoured, patient. Asks questions back. Believes engineers look before they touch.',
    look: { outfit: 'coat', accessory: 'lanyard', hairStyle: 'bun', body: 0xe8ecf7, head: 0xf2c9a0, accent: 0x2f9e8f, hair: 0xb8c0d8, hat: 'none' },
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
    look: { outfit: 'overalls', accessory: 'toolbelt', hairStyle: 'short', body: 0xd98a2b, head: 0xd9a877, accent: 0xf2c14e, hair: 0x3a2a1a, hat: 'hardhat' },
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
    look: { outfit: 'jacket', accessory: 'lanyard', hairStyle: 'short', body: 0x2b6cb0, head: 0xc99267, accent: 0xff9f1c, hair: 0x1f1a1a, hat: 'cap' },
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
    look: { outfit: 'vest', accessory: 'satchel', hairStyle: 'long', body: 0x2f9e8f, head: 0xd9a877, accent: 0xe9d8a6, hair: 0x2a1a12, hat: 'headband' },
    dialogue: [
      { when: { notEffect: 'never:ever' }, lines: ['This is the Simulation Room. When something breaks in the world, come here. A failure is a measurement, not a verdict.', 'The terminals here build a short training plan from exactly what went wrong. Work it through and your Focus comes back.'] },
    ],
  },
];

const HUB: Npc3D[] = [
  {
    id: 'kip', icon: '🤖', name: 'Kip', role: 'Receptionist robot, Robotics Academy',
    personality: 'A cheerful, slightly overeager service robot who narrates his own status lights.',
    look: { body: 0x7dffb3, head: 0xcfd6ea, accent: 0x2f9e8f, shape: 'robot', scale: 0.9 },
    dialogue: [
      { when: { effect: 'bay.bolt:awake' }, mood: 'cheer', lines: ['Bzzt! Bolt-7 is walking again. He told me himself. I am so pleased my lights are doing the thing.', 'The Manufacturing Floor is through the north-east door. Engineer Ori is very busy, very polite, and very short on programmers.'] },
      { when: { quest: { id: 'q-bay-briefing', status: ['completed'] } }, lines: ['His display is on! Status lights: delighted. The rest of the repair is in the Bay.'] },
      { when: { quest: { id: 'q-bay-briefing', status: ['available'] }, notMet: 'kip' }, mood: 'cheer', lines: ['Bzzt! A new face! Welcome to the Robotics Academy. I am Kip: reception, directions and, on weekends, moral support.', 'Mentor Juno needs help in the Maintenance Bay: a robot is down. Follow the blue trail on the floor to the north-west door and you will find her.', 'Everything in this building can be fixed with code. Nothing in this building can be fixed by guessing.'] },
      { when: { quest: { id: 'q-bay-briefing', status: ['available', 'accepted', 'in-progress'] } }, lines: ['The Maintenance Bay is through the north-west door. The blue trail on the floor will take you there.'] },
      { lines: ['Welcome to the Robotics Academy. Maintenance Bay is the north-west door: a robot needs you. The Manufacturing Floor is north-east. The Simulation Room on the west is where you train when something goes wrong.', 'Everything in this building can be fixed with code. Nothing in this building can be fixed by guessing.'] },
    ],
  },
  {
    id: 'pip', icon: '🧭', name: 'Pip', role: 'Guide of Bytehaven',
    personality: 'Bright, curious, always slightly out of breath. Has walked every road in Bytehaven and loves telling people they may choose their own.',
    look: { outfit: 'jacket', accessory: 'backpack', hairStyle: 'long', body: 0xd98a2b, head: 0xf0c9a0, accent: 0x7dffb3, hair: 0xc94f6d, hat: 'cap', scale: 0.92 },
    dialogue: [
      { when: { bossPassed: 'summit' }, mood: 'cheer', lines: ['You did it. The whole plant is lit. I watched from the fountain and I have never seen Bytehaven so bright.', 'Go wherever you like now. Every road is still open, and some of them are more fun when nothing is at stake.'] },
      { when: { bossPassed: 'mastery-python' }, lines: ['A guardian beaten! The Summit Trail in the north-east opens for anyone who has shown enough in any three worlds. You do not need the same three as anybody else.'] },
      { when: { met: 'pip' }, lines: ['Robotics is west, the magic academy is north, the ballpark is east and the raceway is south. They teach different things, but they all run on the same idea: you change the world by writing things down precisely.', 'Go in any order. The map board knows where you have been.'] },
      { lines: ['Welcome to Bytehaven! Four worlds and a mountain. Robotics to the west, the Lanternhollow magic academy to the north, Harborview Park to the east, the Redline Raceway to the south.', 'There is no right first. Some doors ask you to have shown a skill before they open, and they will say exactly which one. Nothing here gives you answers; everything here rewards working things out.', 'Two tips: a glowing diamond above someone means they have work for you, and if something goes wrong, the Simulation Room in the Robotics Academy is where you train.'] },
    ],
  },
];

export const cast: Npc3D[] = [...ROBOTICS, ...HUB];
const byId = new Map(cast.map((n) => [n.id, n]));
export const getNpc3D = (id: string): Npc3D | undefined => byId.get(id);

const ACADEMY: Npc3D[] = [
  {
    id: 'teselle', icon: '🧙‍♀️', name: 'Warden Teselle', role: 'Warden of Lanternhollow Academy',
    personality: 'Dry, exact and quietly warm. Speaks as if every sentence had to pass an inspection. Hates magic done by guessing.',
    look: { outfit: 'robe', hairStyle: 'long', body: 0x4b3a7a, head: 0xd9b48f, accent: 0xffd98a, hair: 0xd8d8e8, hat: 'wizard', scale: 1.02 },
    dialogue: [
      { when: { quest: { id: 'q-lantern-duel', status: ['completed'] } }, mood: 'cheer', lines: ['The ring is quiet, the lanterns burn, and the Gloomhound has not been seen since. You have earned the thing we give to very few students: my complete trust.', 'The Summit beacon will need people like you. Go where you are needed.'] },
      { when: { quest: { id: 'q-lantern-briefing', status: ['completed'] } }, lines: ['You found the first fault, and you wrote the first fix. Bram will tell you what comes next. A ward is only as good as the rune under it.'] },
      { when: { quest: { id: 'q-lantern-briefing', status: ['accepted', 'in-progress'] }, notSeen: 'dark-lantern' }, lines: ['Look at the dark lantern by the pond first. Do not start a repair before you have looked at the failure.'] },
      { when: { quest: { id: 'q-lantern-briefing', status: ['accepted', 'in-progress'] } }, lines: ['The Runecraft Hall is through the big doors to the north. Tutor Bram will be there. The Rune Lectern is yours to use. Write carefully; the hall reads what you write exactly.'] },
      { when: { quest: { id: 'q-lantern-briefing', status: ['available'] } }, offer: 'q-lantern-briefing', mood: 'worry', lines: ['Welcome to Lanternhollow. I am Teselle, Warden here.', 'Our lanterns are failing, one by one. Not from age: from unsound runework, written by people who guessed. You cannot guess a rune. It says exactly what you wrote, and nothing else.', 'Look at the dark lantern by the pond. Then go to the Runecraft Hall and write what the academy has forgotten. Will you?'] },
      { lines: ['Precision is a kindness. Write what you mean.'] },
    ],
  },
  {
    id: 'bram', icon: '🧑‍🎓', name: 'Tutor Bram Quillfeather', role: 'Tutor of Runecraft',
    personality: 'Gentle, scatterbrained and never wrong about a rune. Forgets where he put his spectacles; remembers every bug he has ever met.',
    look: { outfit: 'robe', accessory: 'satchel', hairStyle: 'curly', body: 0x3f6a7a, head: 0xe0b48e, accent: 0xb48cff, hair: 0x8a8aa8, hat: 'hood' },
    dialogue: [
      { when: { quest: { id: 'q-lantern-wards', status: ['completed'] } }, mood: 'cheer', lines: ['Did you see the dome? Coloured, thick, every glyph in its place, and it fits the hall however the hall is shaped. That is what a ward is: a promise about how things will look, kept.'] },
      { when: { quest: { id: 'q-lantern-wards', status: ['accepted', 'in-progress'] } }, lines: ['The Ward Lectern is the second one. Change one thing at a time and look at the dome after each change. A ward you cannot watch is a ward you cannot trust.'] },
      { when: { quest: { id: 'q-lantern-wards', status: ['available'] } }, offer: 'q-lantern-wards', lines: ['Ah, the new one! Warden Teselle said you would come. Runes give things meaning; wards give them form.', 'The old dome fell when the lanterns went dark. Shall we raise it again? Colour first, then thickness, then the glyphs, and finally making it fit any hall.'] },
      { when: { quest: { id: 'q-lantern-briefing', status: ['accepted', 'in-progress'] } }, lines: ['The Rune Lectern is on your left. A rune is not decoration, it is meaning: a heading is a heading because it heads something. Get the meaning right and the rest follows.'] },
      { lines: ['Mind the lectern. It bites if you leave a tag open.'] },
    ],
  },
  {
    id: 'nim', icon: '🧒', name: 'Apprentice Nim', role: 'Second-year apprentice',
    personality: 'Quick, competitive, secretly worried. Finished the exams two years early and has never solved anything that was not on one.',
    look: { outfit: 'jacket', accessory: 'scarf', hairStyle: 'short', body: 0xc2603a, head: 0xcf9a72, accent: 0x5ee6d0, hair: 0x1f1a1a, hat: 'headband', scale: 0.92 },
    dialogue: [
      { when: { quest: { id: 'q-lantern-duel', status: ['completed'] } }, mood: 'cheer', lines: ['You beat it. On a problem that was not on any exam. I have been trying to work out how, and I think the honest answer is that you looked before you cast.', 'Teach me?'] },
      { when: { quest: { id: 'q-lantern-duel', status: ['accepted', 'in-progress'] } }, lines: ['The Incantation Lectern is at the west side of the ring. Every spell that really works hits it. Every spell that does not, it notices.', 'Do not panic when it bites back. Read what your spell actually did, not what you meant it to do.'] },
      { when: { quest: { id: 'q-lantern-duel', status: ['available'] } }, offer: 'q-lantern-duel', lines: ['Wards up? Good. Because something has crept into the Dueling Ring and it is eating the light. Gloomhound. Warden says it only fears incantations that work.', 'I tried three spells. I was sure each one was right. It laughed at all three. Will you go?'] },
      { lines: ['Hi. I am Nim. Do not tell Tutor Bram I was in the library after hours.'] },
    ],
  },
];
cast.push(...ACADEMY);
byId.clear(); for (const n of cast) byId.set(n.id, n);

const BALLPARK: Npc3D[] = [
  {
    id: 'reyes', icon: '🧢', name: 'Coach Reyes', role: 'Manager, Harborview Herons',
    personality: 'Loud, loyal and stubborn. Has picked his lineup by feel for twenty years and is starting to suspect feel is losing him games.',
    look: { outfit: 'jacket', build: 'broad', hairStyle: 'short', body: 0x1d4d8f, head: 0xc99267, accent: 0xffd166, hair: 0x5a5a66, hat: 'cap', scale: 1.05 },
    dialogue: [
      { when: { seen: 'sim-win' }, mood: 'cheer', lines: ['We won. With a lineup I did not pick. I have been managing for twenty years and I have not felt this foolish or this happy in a long time.', 'Keep the numbers coming, Analyst.'] },
      { when: { quest: { id: 'q-park-lineup', status: ['accepted', 'in-progress'] }, effect: 'field.lineup:set' }, lines: ['That is a lineup. Nine names, nine positions, and every one of them is there because of a number. Step up to home plate and call for a game. I will keep my mouth shut. Mostly.'] },
      { when: { quest: { id: 'q-park-lineup', status: ['accepted', 'in-progress'] } }, lines: ['Summaries, positions, then the join that ties players to their stats. Dara has the console. I will send out whatever you can justify, and I can tell when someone is guessing.'] },
      { when: { quest: { id: 'q-park-lineup', status: ['available'] } }, offer: 'q-park-lineup', lines: ['Dara says you cleaned the roster. Good. Now I need an actual lineup, and I want it from the data, not from my gut.', 'Summarise the season, group the players by position, join them to their stats. Give me nine names I can defend. Then we play a game and we find out. Deal?'] },
      { when: { quest: { id: 'q-park-numbers', status: ['accepted', 'in-progress'] } }, lines: ['Talk to Dara in the Analytics Office, the building by third base. Do what she says. I know, I know. Do it anyway.'] },
      { lines: ['Right now I pick by jersey number. Do not judge me. Go see Dara in the Analytics Office and find out why I should stop.'] },
    ],
  },
  {
    id: 'dara', icon: '📊', name: 'Analyst Dara', role: 'Head of Analytics, Harborview Herons',
    personality: 'Exact, funny, allergic to anecdotes. Answers “why” with a query. Keeps a sticky note on her monitor: “What would change my mind?”',
    look: { outfit: 'coat', accessory: 'lanyard', hairStyle: 'long', body: 0x7a3f8c, head: 0xb98560, accent: 0x7dffb3, hair: 0x1a1020, hat: 'headband' },
    dialogue: [
      { when: { quest: { id: 'q-park-lineup', status: ['completed'] } }, mood: 'cheer', lines: ['A win, and you can tell me exactly why. That is the job. The numbers are only half of it; the other half is being able to defend them.'] },
      { when: { quest: { id: 'q-park-numbers', status: ['completed'] } }, lines: ['Clean roster, clean ranking. Coach Reyes is waiting outside with a lineup card and a lot of opinions.'] },
      { when: { quest: { id: 'q-park-numbers', status: ['accepted', 'in-progress'] } }, lines: ['The console asks the league database. Start with the roster, then rank, then deal with missing values: a hitter with no stats is not a zero, he is a question.'] },
      { when: { quest: { id: 'q-park-numbers', status: ['available'] } }, offer: 'q-park-numbers', lines: ['You are the new analyst. Good. I am Dara.', 'Here is the situation: a season of data, a manager who picks by jersey number, and a stadium full of people who would like to win.', 'Start by loading the roster, ranking the hitters and cleaning what is missing. It is less glamorous than it sounds and exactly as important. Ready?'] },
      { lines: ['Ask the database. Do not guess.'] },
    ],
  },
];
cast.push(...BALLPARK);
byId.clear(); for (const n of cast) byId.set(n.id, n);

const RACING: Npc3D[] = [
  {
    id: 'marisol', icon: '🏎️', name: 'Crew Chief Marisol', role: 'Crew chief, Redline Raceway',
    personality: 'Fast-talking, blunt, always holding a stopwatch. Believes every driver complaint is a measurement waiting to be read.',
    look: { outfit: 'overalls', accessory: 'goggles', hairStyle: 'short', body: 0xe63946, head: 0xc99267, accent: 0xffffff, hair: 0x2a1a12, hat: 'cap' },
    dialogue: [
      { when: { quest: { id: 'q-race-fast', status: ['completed'] } }, mood: 'cheer', lines: ['Under par, on a car you set up from the numbers. That is the whole job: read it, fix it, drive it, check it.', 'Keep the flag. You earned it.'] },
      { when: { quest: { id: 'q-race-fast', status: ['accepted', 'in-progress'] } }, lines: ['Fuel load and aero are the last two. Then go and beat my par time. Not “a good lap”: my number. Measure it.'] },
      { when: { quest: { id: 'q-race-fast', status: ['available'] } }, offer: 'q-race-fast', lines: ['You can drive it. Now make it quick.', 'Two systems left: fuel strategy and aerodynamics. Both are in the telemetry. Fix them, then beat my par lap with the car you built. Deal?'] },
      { when: { quest: { id: 'q-race-setup', status: ['accepted', 'in-progress'] } }, lines: ['Telemetry console. Tyres first: pressure from the temperatures. Then brake balance. The car will tell you if you were right. Loudly.'] },
      { when: { quest: { id: 'q-race-setup', status: ['available'] } }, offer: 'q-race-setup', lines: ['You are the new data person? Good. Look at that car. It slides in every corner and the brakes lock up on the straight. The driver says “it feels wrong”. That is not data.', 'The telemetry is data. It already knows why the car slides. Learn to read it in a spreadsheet, fix the setup, and then you drive the difference. Interested?'] },
      { lines: ['Stopwatch does not lie. People do.'] },
    ],
  },
];
cast.push(...RACING);
byId.clear(); for (const n of cast) byId.set(n.id, n);

const SUMMIT: Npc3D[] = [
  {
    id: 'aurel', icon: '🧓', name: 'Keeper Aurel', role: 'Keeper of the Summit beacon',
    personality: 'Old, unhurried, amused by everything. Has watched every engineer who came up this trail and remembers the ones who asked “why” more than the ones who were fast.',
    look: { outfit: 'robe', accessory: 'cape', hairStyle: 'long', body: 0x6b4a8c, head: 0xd9b48f, accent: 0xffd166, hair: 0xe8e8f0, hat: 'hood', scale: 0.98 },
    dialogue: [
      { when: { bossPassed: 'summit' }, mood: 'cheer', lines: ['There it is. The dawn.', 'The robots walk, the lanterns burn, the scoreboard is lit and the telemetry tells the truth. All of it because people learned to write things down precisely, then check them.', 'The trail is open to you any time. Some of the best days up here are the ones with nothing to fix.'] },
      { when: { any: [{ bossPassed: 'mastery-python' }, { bossPassed: 'mastery-sql' }, { bossPassed: 'mastery-data-eng' }, { bossPassed: 'mastery-web' }, { bossPassed: 'mastery-analytics' }, { bossPassed: 'mastery-sheets' }, { bossPassed: 'mastery-r' }] }, lines: ['Each guardian you defeat lights one of the seven beacons, whatever tools you used. Three are enough to reach the console and face the report itself.', 'Choose the tools you trust. Nobody is going to tell you which ones the problem needs.'] },
      { lines: ['The Great Outage began here, on the night every system in Bytehaven failed at once. The beacon went dark first.', 'To light it you have to show, to the guardians, that you can solve a problem nobody prepared you for: no hints, one attempt, your own tools. I will not make it easier. I will tell you it is possible.'] },
    ],
  },
];
cast.push(...SUMMIT);
byId.clear(); for (const n of cast) byId.set(n.id, n);
