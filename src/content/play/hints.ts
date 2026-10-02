import type { Track } from '../worlds';

/**
 * WHAT PEOPLE NOTICE ABOUT YOUR PROGRESS. After their usual line an NPC may add one remark, said once, that reads the player's real record: a world they are
 * strong in and another they have not touched, a skill still wobbly after a recent attempt, how many worlds are in good shape and the Summit. The
 * conditions are evaluated from the same evidence the Skills view uses (play/logic/hints.ts), never from XP or levels, and a remark only POINTS
 * (a place, a world, the Training Grounds); it never says how to solve anything.
 *
 * Tokens in `line`: {world} (the world with a wobble), {n} (worlds in good shape).
 */
export interface HintWhen {
  /** Worlds where the player has shown independent work on at least two skills. */
  strong?: Track[];
  /** Worlds the player has not begun. */
  untouched?: Track[];
  /** Some skill is still open as a weakness after a recent attempt (any world; fills {world}). */
  trouble?: boolean;
  /** At least this many worlds are strong. */
  strongWorlds?: number;
}
export interface Hint { id: string; npcs: string[]; when: HintWhen; line: string }

const ROBOTICS = ['juno', 'rowan', 'ori-floor', 'kip'];
const ACADEMY = ['teselle', 'bram', 'nim'];
const PARK = ['reyes', 'dara'];

export const HINTS: Hint[] = [
  { id: 'py-to-sql', npcs: ROBOTICS, when: { strong: ['python'], untouched: ['sql'] }, line: 'Your Python is steady now. The analysts at Harborview Park keep a whole season in databases: the Analytics Office off the ballpark concourse, the Data Center. Python alone cannot ask it a question.' },
  { id: 'web-to-sql', npcs: ACADEMY, when: { strong: ['web'], untouched: ['sql'] }, line: 'Fine pages. But where will the data come from? The Analytics Office at Harborview Park keeps it, and there is a language for asking.' },
  { id: 'py-to-web', npcs: ACADEMY, when: { strong: ['python'], untouched: ['web'] }, line: 'You think in loops and functions already. The runes here are the same ideas in a new language. Try the Rune Lectern.' },
  { id: 'sql-to-web', npcs: PARK, when: { strong: ['sql'], untouched: ['web'] }, line: 'You can ask a database anything now. Lanternhollow Academy teaches the other half: putting the answers on a page people can use.' },
  { id: 'py-to-sheets', npcs: ['marisol'], when: { strong: ['python'], untouched: ['sheets'] }, line: 'Telemetry is only data. A spreadsheet can model it by formula, and you will see the car change when it is right. The telemetry console is behind me.' },
  { id: 'sql-to-py', npcs: PARK, when: { strong: ['sql'], untouched: ['python'] }, line: 'Queries only get you so far. When you want to clean, loop and decide, the Programming Hall in the Robotics Academy is where that is taught.' },
  { id: 'wobble', npcs: ['sana-sim', ...ROBOTICS, ...ACADEMY, ...PARK, 'marisol'], when: { trouble: true }, line: 'Something in {world} is still wobbly after a recent attempt. The Training Grounds, here in the Simulation Room, will shore it up. It costs your progress nothing.' },
  { id: 'summit-near', npcs: ['pip', 'juno', 'teselle', 'reyes', 'marisol'], when: { strongWorlds: 2 }, line: '{n} worlds are in good shape now. Keeper Aurel on the Summit Trail asks for three guardians beaten; the trail leaves from the north-east of the plaza.' },
];
