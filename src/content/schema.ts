/**
 * Curriculum content schema (types only). Content is DATA, kept separate from engine code,
 * so the curriculum can grow without touching game systems. Concrete content will live in
 * subfolders of src/content/ (one per learning area) and be validated against these types.
 */
import type { Language } from '../learning/runner';

export interface Skill {
  id: string;
  title: string;
  area: string; // e.g. 'python', 'sql', 'debugging', 'research'
  prerequisites: string[]; // skill ids
}

export interface Challenge {
  id: string;
  skillIds: string[];
  title: string;
  prompt: string;
  language?: Language;
  /** Starter code. Should trend toward empty as guidance is faded. */
  starterCode?: string;
  /** Automated tests run against the player's code. */
  tests: { name: string; code: string }[];
  /** Progressive hints. Using them lowers the evidence strength recorded. */
  hints: string[];
}
