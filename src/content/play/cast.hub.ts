import type { Npc3D } from '../../play/logic/dialogue';

/**
 * THE PEOPLE OF THE PLAZA who come back as Bytehaven does, plus Mentor Juno as she is in the plaza (the guide of the story, not the quest giver of
 * the Maintenance Bay). They say what is TRUE of the world now (conditions read the real record of what the player's code changed) and only
 * point: nobody tells anyone how to solve anything.
 */
export const HUB_PEOPLE: Npc3D[] = [
  {
    id: 'juno-hub', icon: '🧑‍🏫', name: 'Mentor Juno', role: 'Head of the Robotics Academy',
    personality: 'Calm, dry-humoured, patient. In the plaza she is the one who stayed to see who would come.',
    look: { outfit: 'coat', accessory: 'lanyard', hairStyle: 'bun', body: 0xe8ecf7, head: 0xf2c9a0, accent: 0x2f9e8f, hair: 0xb8c0d8, hat: 'none' },
    dialogue: [
      { when: { bossPassed: 'summit' }, mood: 'cheer', lines: ['There you are.', 'I stood in this plaza the night it all went dark and I did not know if anyone could do it. Look at it now.'] },
      { when: { quest: { id: 'q-bay-awaken', status: ['completed'] } }, mood: 'cheer', lines: ['Bolt-7 walks, and the west gate knows it. That is how it works: one thing you fix tells the next thing it can start.', 'Four worlds, and every one of them is waiting for someone who can do exactly what you just did.'] },
      { when: { met: 'juno-hub' }, lines: ['Every gate is a way back in. Choose the one that interests you; nobody is asking you to do them in an order.', 'When something goes wrong, the Simulation Room is where you train. It is a place to get better, not a punishment.'] },
      { mood: 'think', lines: ['You made it through the plaza, which is more than the lights managed.', 'Bytehaven is four worlds wired to one core. Each gate leads to a place that stopped working, and each place starts again when someone who understands it fixes it.', 'Begin wherever you like. Nobody is going to hand you the answers, but every answer you earn here stays earned.'] },
    ],
  },
  {
    id: 'halden', icon: '🦾', name: 'Engineer Halden', role: 'Robotics Academy field engineer',
    personality: 'Easy, observant, always wiping his hands. Notices the small signs that a machine is waking up.',
    look: { outfit: 'jacket', accessory: 'techpack', hairStyle: 'short', body: 0x3a6ea5, head: 0xc99267, accent: 0x7dffb3, hair: 0x1f1a1a, hat: 'cap' },
    dialogue: [
      { when: { effect: 'floor.dashboard:light' }, mood: 'cheer', lines: ['The Floor’s dashboard is lit. I checked it from the gate: clean data, steady line. Somebody there writes careful code.'] },
      { when: { effect: 'floor.belt:run' }, lines: ['I can hear the Manufacturing Floor’s belt from here. First time since the outage.'] },
      { when: { effect: 'bay.bolt:awake' }, lines: ['The bay’s heartbeat came back on the grid this morning. A robot, standing up on his own, and the whole west lane flickered.'] },
      { lines: ['West gate has been dark since the outage. I keep watching it for a flicker. Not yet.'] },
    ],
  },
  {
    id: 'fenn', icon: '🧢', name: 'Scout Fenn', role: 'Harborview Park scout',
    personality: 'Chatty, numbers-first, will argue a batting order with a lamppost.',
    look: { outfit: 'vest', accessory: 'satchel', hairStyle: 'curly', body: 0x2563a8, head: 0xe0b48f, accent: 0xffd166, hair: 0x4a2d1a, hat: 'cap' },
    dialogue: [
      { when: { effect: 'field.lineup:set' }, mood: 'cheer', lines: ['They are playing the lineup the data picked. I watched three innings from the gate with my mouth open.'] },
      { when: { effect: 'office.roster:load' }, lines: ['The roster board is filled in again. It is not a lineup yet, but I have a list to argue with at last.'] },
      { lines: ['The park has been dark since the outage. Scoreboard, scouting reports, all of it. I can tell you a hitter’s average by his walk, but nobody believes me without the numbers.'] },
    ],
  },
  {
    id: 'quill', icon: '🖋️', name: 'Scribe Quill', role: 'Lanternhollow page-keeper',
    personality: 'Ink on the cuffs, precise about words, delighted by a well-formed page.',
    look: { outfit: 'robe', accessory: 'scarf', hairStyle: 'long', body: 0x6b4a8c, head: 0xd9b48f, accent: 0xbd93f9, hair: 0x2a1a12, hat: 'none' },
    dialogue: [
      { when: { effect: 'arena.oracle:answer' }, mood: 'cheer', lines: ['The oracle answered a request from a page somebody wrote. A page that talks to a server: that is the whole of the north gate working again.'] },
      { when: { effect: 'hall.portal:open' }, lines: ['A form that opens a portal. Every page I ever wrote was only a letter; this one is a door.'] },
      { lines: ['The north gate’s pages have been blank since the outage. Pages are not magic, you know. Somebody has to write each one, carefully.'] },
    ],
  },
  {
    id: 'jory', icon: '🏁', name: 'Pit Chief Jory', role: 'Redline Raceway pit crew',
    personality: 'Clipped, funny, trusts a stopwatch more than a feeling.',
    look: { outfit: 'tech', accessory: 'lanyard', hairStyle: 'bald', body: 0xc0392b, head: 0xb98563, accent: 0xf5f5f5, hair: 0x2a1a12, hat: 'helmet', build: 'broad' },
    dialogue: [
      { when: { effect: 'garage.car:aero' }, mood: 'cheer', lines: ['The car is whole. Tyres, brakes, fuel, aero, every setting read out of a sheet of numbers. The board does not lie, so I believe it.'] },
      { when: { effect: 'garage.car:tyres' }, lines: ['The pit board blinked this morning. Tyre pressures, from somebody who read the temperatures. The raceway remembers how to be fast.'] },
      { lines: ['Timing board is dead, telemetry is dead, and a pit crew without numbers is just people with wrenches.'] },
    ],
  },
];
