import type { Challenge, Lesson, WorldEffect } from './schema';
import { objectiveOf } from './helpers';

/**
 * WORLD EFFECTS: what the game world should do when the player demonstrates something. This is the contract between learning and any
 * future visual world (Phase 6): the learning engine only ever says "this target, this action"; scenes, themes and animations live elsewhere
 * and map targets to their own objects. Nothing here draws anything, and swapping the theme (a robot yard, an original wizard academy, an
 * API district, a race track) changes no rule, no challenge and no saved data.
 *
 * Naming: `target` is `area.object` in kebab-case (`vault.door`), `action` is one kebab-case verb (`open`). Effects follow a PASS of the
 * lesson's final challenge (or a boss), never XP, levels or completion counts.
 */
export const LESSON_EFFECTS: Record<string, WorldEffect[]> = {
  'py-13-wake-robot': [{ target: 'academy.robot', action: 'wake' }],
  'sql-06-joins': [{ target: 'archive.index', action: 'link' }],
  'web-05-forms': [{ target: 'district.billboard', action: 'light' }],
  'de-09-reporting': [{ target: 'works.conveyor', action: 'start' }],
  'de-10-analytics': [{ target: 'works.dashboard', action: 'light' }],
  'git-04-merging': [{ target: 'vault.bridge', action: 'join' }],
  'git-06-workflow': [{ target: 'vault.door', action: 'open' }],
  'xl-04-lookups': [{ target: 'guild.catalog', action: 'link' }],
  'xl-08-modelling': [{ target: 'guild.ledger', action: 'balance' }],
  'r-03-functions': [{ target: 'lab.device', action: 'power-up' }],
  'r-06-analysis': [{ target: 'lab.board', action: 'report' }],
  'st-02-spread': [{ target: 'observatory.lens', action: 'focus' }],
  'st-08-inference': [{ target: 'observatory.telescope', action: 'resolve' }],
};

/** Boss id -> effect on defeating it (the Summit lights the beacon, whichever route won it). */
export const BOSS_EFFECTS: Record<string, WorldEffect[]> = {
  'mini-python-functions': [{ target: 'academy.gate', action: 'open' }],
  'mastery-python': [{ target: 'summit.beacon-python', action: 'light' }],
  'mastery-sql': [{ target: 'summit.beacon-sql', action: 'light' }],
  'mastery-data-eng': [{ target: 'summit.beacon-works', action: 'light' }],
  'mastery-web': [{ target: 'summit.beacon-web', action: 'light' }],
  'mastery-analytics': [{ target: 'summit.beacon-analytics', action: 'light' }],
  'mastery-sheets': [{ target: 'summit.beacon-sheets', action: 'light' }],
  'mastery-r': [{ target: 'summit.beacon-r', action: 'light' }],
  summit: [{ target: 'summit.beacon', action: 'ignite' }],
};

/** Attaches the effects above to the challenges that complete them (every variant of the lesson's final objective, and each boss version). */
export function attachWorldEffects(lessons: Lesson[], challenges: Challenge[], bossChallenges: Challenge[]): void {
  for (const l of lessons) {
    const effects = LESSON_EFFECTS[l.id];
    if (!effects) continue;
    const last = [...l.steps].reverse().find((s) => s.kind === 'challenge');
    if (!last || last.kind !== 'challenge') continue;
    const final = challenges.find((c) => c.id === last.challengeId);
    if (!final) continue;
    for (const c of challenges) if (objectiveOf(c) === objectiveOf(final)) c.worldEffects = effects;
  }
  for (const c of bossChallenges) if (c.boss && BOSS_EFFECTS[c.boss.bossId]) c.worldEffects = BOSS_EFFECTS[c.boss.bossId];
}
