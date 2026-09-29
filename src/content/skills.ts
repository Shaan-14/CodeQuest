import type { Skill } from './schema';

const req = (independentPasses: number, distinctChallenges: number, minDifficulty: number) => ({
  independentPasses,
  distinctChallenges,
  minDifficulty,
});

/**
 * Skills the evidence system tracks. `masteryRequirements` says what independent performance
 * counts as "demonstrated" (see learning/mastery.ts). Requirements must be satisfiable by the
 * shipped challenges — content.test.ts checks this.
 */
export const skills: Skill[] = [
  { id: 'py.output', title: 'Output & first programs', area: 'python', category: 'Python foundations', prerequisites: [], masteryRequirements: req(1, 1, 1) },
  { id: 'py.debugging', title: 'Reading errors & debugging', area: 'python', category: 'Python foundations', prerequisites: ['py.output'], masteryRequirements: req(1, 1, 2) },
  { id: 'py.variables', title: 'Variables & values', area: 'python', category: 'Python foundations', prerequisites: ['py.output'], masteryRequirements: req(2, 2, 2) },
  { id: 'py.strings', title: 'Strings & text', area: 'python', category: 'Python foundations', prerequisites: ['py.variables'], masteryRequirements: req(2, 2, 2) },
  { id: 'py.numbers', title: 'Numbers & arithmetic', area: 'python', category: 'Python foundations', prerequisites: ['py.variables'], masteryRequirements: req(2, 2, 2) },
  { id: 'py.input', title: 'Input & type conversion', area: 'python', category: 'Python foundations', prerequisites: ['py.numbers', 'py.strings'], masteryRequirements: req(2, 2, 2) },
  { id: 'py.logic', title: 'Booleans & comparisons', area: 'python', category: 'Python foundations', prerequisites: ['py.numbers'], masteryRequirements: req(2, 2, 2) },
  { id: 'py.conditionals', title: 'Decisions (if / elif / else)', area: 'python', category: 'Python foundations', prerequisites: ['py.logic', 'py.input'], masteryRequirements: req(2, 2, 2) },
  { id: 'py.loops', title: 'Loops (while / for / range)', area: 'python', category: 'Python foundations', prerequisites: ['py.conditionals'], masteryRequirements: req(2, 2, 2) },
  { id: 'py.functions', title: 'Functions', area: 'python', category: 'Python foundations', prerequisites: ['py.conditionals'], masteryRequirements: req(2, 2, 2) },
];
