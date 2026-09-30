/**
 * LEARNING WORLDS. CodeQuest is not one course: it is a map of worlds, each teaching one technology. Foundations are
 * open from the start (a player may begin in any of them and leave whenever they like); advanced and cross-world
 * lessons declare the competencies they need (Lesson.requires) and the game explains exactly what is missing (game/graph.ts).
 * Data only: no rules live here.
 */

export type Track = 'python' | 'sql' | 'data-eng' | 'web' | 'stats' | 'r' | 'sheets' | 'git';

export interface World {
  track: Track;
  /** The map area (content/world.ts) where this world's lessons live. */
  areaId: string;
  name: string;
  icon: string;
  /** True when a player can start here with no prior skills. */
  foundation: boolean;
  /** Lesson id prefixes that belong to the world. */
  prefixes: string[];
  /** Skill id prefixes (`py.loops` -> `py`) that belong to the world. */
  skillPrefixes: string[];
  blurb: string;
  /** Quest givers who offer this world's story quests (content/world.ts). */
  givers: string[];
}

export const worlds: World[] = [
  { track: 'python', areaId: 'training-grounds', name: 'Python: Programming Hall', icon: '🤖', foundation: true, prefixes: ['py-'], skillPrefixes: ['py', 'sd', 'ps', 'test'], blurb: 'Write real programs: variables, decisions, loops, functions, data, files, testing and design.', givers: ['Mentor Juno'] },
  { track: 'sql', areaId: 'data-center', name: 'SQL: Database District', icon: '🗄️', foundation: true, prefixes: ['sql-'], skillPrefixes: ['sql', 'db'], blurb: 'Ask questions of real databases, change data safely and design tables that protect themselves.', givers: ['Architect Vex'] },
  { track: 'web', areaId: 'web-district', name: 'Web: HTML, CSS & JavaScript', icon: '🌐', foundation: true, prefixes: ['web-'], skillPrefixes: ['web', 'js'], blurb: 'Build pages and apps in a real browser sandbox: structure, style, behaviour and APIs.', givers: ['Builder Nia', 'Coder Kiran', 'Gatekeeper Marlo'] },
  { track: 'git', areaId: 'version-vault', name: 'Git: Version Vault', icon: '🗝️', foundation: true, prefixes: ['git-'], skillPrefixes: ['git'], blurb: 'Track, branch, merge and review work the way professional teams do.', givers: ['Archivist Mira'] },
  { track: 'sheets', areaId: 'spreadsheet-guild', name: 'Spreadsheets: Guild Hall', icon: '📊', foundation: true, prefixes: ['xl-'], skillPrefixes: ['xl'], blurb: 'Formulas, lookups, tables, pivot tables and models: the most widely used data tool there is.', givers: ['Keeper Brass'] },
  { track: 'r', areaId: 'r-lab', name: 'R: Laboratory', icon: '🔬', foundation: true, prefixes: ['r-'], skillPrefixes: ['r'], blurb: 'Real R: vectors, data frames, functions and analysis of datasets.', givers: ['Professor Quill'] },
  { track: 'stats', areaId: 'observatory', name: 'Statistics: Analytics Observatory', icon: '🔭', foundation: false, prefixes: ['st-'], skillPrefixes: ['stat'], blurb: 'Describe data, reason about chance and read results honestly. Needs a little programming to explore real datasets.', givers: ['Dr. Pell'] },
  { track: 'data-eng', areaId: 'pipeline-works', name: 'Data Engineering: Pipeline Works', icon: '🏭', foundation: false, prefixes: ['de-'], skillPrefixes: ['de'], blurb: 'Move data from raw files into databases reliably. Combines Python and SQL, so it needs both.', givers: ['Engineer Ori'] },
];

export const worldOfTrack = (t: Track): World => worlds.find((w) => w.track === t)!;

export function trackOfLessonId(id: string): Track {
  for (const w of worlds) if (w.prefixes.some((p) => id.startsWith(p))) return w.track;
  return 'python';
}

export function trackOfSkillId(skillId: string): Track {
  const head = skillId.split('.')[0]!;
  return worlds.find((w) => w.skillPrefixes.includes(head))?.track ?? 'python';
}

export const worldOfArea = (areaId: string): World | undefined => worlds.find((w) => w.areaId === areaId);
