import type { SkillReq } from '../schema';
import type { WorldId } from '../../play/logic/sceneTypes';

/**
 * THE WORLDS of the playable game: where each begins, what it teaches (the learning worlds of content/worlds.ts it presents), and its story
 * quests. The skill graph stays the only authority on access: a gate here names the same competencies (`requires`/`area`) the classic map uses.
 */
export interface World3D {
  id: WorldId;
  name: string;
  icon: string;
  tagline: string;
  /** What you learn here (in plain words). */
  teaches: string;
  /** Learning worlds (content/worlds.ts tracks) this one is the presentation of. */
  tracks: string[];
  entry: { scene: string; spawn: string };
  scenes: string[];
  quests: string[];
  requires?: SkillReq[];
  area?: string;
}

export const worlds3d: World3D[] = [
  { id: 'hub', name: 'Bytehaven Plaza', icon: '🏛️', tagline: 'The crossroads. Four gates and a mountain trail.', teaches: 'Choosing your own path', tracks: [], entry: { scene: 'plaza', spawn: 'default' }, scenes: ['plaza'], quests: [] },
  {
    id: 'robotics', name: 'Robotics Academy', icon: '🤖', tagline: 'Engineers, machines and a robot that needs a programmer.', teaches: 'Python: from your first program to files and data',
    tracks: ['python', 'data-eng'], entry: { scene: 'robotics-atrium', spawn: 'from-plaza' }, scenes: ['robotics-atrium', 'maintenance-bay', 'manufacturing-floor', 'sim-room'],
    quests: ['q-bay-briefing', 'q-bay-repair', 'q-bay-brain', 'q-bay-awaken', 'q-floor-line', 'q-floor-logs'],
  },
  {
    id: 'academy', name: 'Lanternhollow Academy', icon: '🏮', tagline: 'A school where spells are pages and wards are styles.', teaches: 'HTML, CSS and JavaScript',
    tracks: ['web'], entry: { scene: 'lantern-courtyard', spawn: 'from-plaza' }, scenes: ['lantern-courtyard', 'spell-classroom', 'arena'], quests: [],
  },
  {
    id: 'ballpark', name: 'Harborview Park', icon: '⚾', tagline: 'A ballpark that runs on data.', teaches: 'SQL and data analysis',
    tracks: ['sql', 'stats'], entry: { scene: 'ballpark', spawn: 'from-plaza' }, scenes: ['ballpark', 'analytics-office'], quests: [],
  },
  {
    id: 'racing', name: 'Redline Raceway', icon: '🏁', tagline: 'Telemetry in, lap times out.', teaches: 'Spreadsheets, formulas and reading data',
    tracks: ['sheets'], entry: { scene: 'garage', spawn: 'from-plaza' }, scenes: ['garage', 'track'], quests: [],
  },
  {
    id: 'summit', name: 'The Summit', icon: '🏔️', tagline: 'The Great Outage. One problem, your choice of tools.', teaches: 'Combining everything you can do',
    tracks: [], entry: { scene: 'summit', spawn: 'from-plaza' }, scenes: ['summit'], quests: [], area: 'summit',
  },
];
export const getWorld3D = (id: string): World3D | undefined => worlds3d.find((w) => w.id === id);
export const worldOfScene = (sceneId: string): World3D | undefined => worlds3d.find((w) => w.scenes.includes(sceneId));
