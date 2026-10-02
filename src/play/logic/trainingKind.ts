/**
 * Which kind of training scene to play when a required plan sends the player to the Simulation Room. It is read from the weakness's own skills
 * (the world that teaches them), so the scene shows the same work the plan is about: code, data, a page, a model, a workbook.
 */
import { trackOfSkillId, type Track } from '../../content/worlds';
import type { SaveData } from '../../core/save';
import { requiredTraining } from '../../game/training';

export type TrainingKind = 'python' | 'data' | 'web' | 'stats' | 'sheet';

const KIND: Record<Track, TrainingKind> = { python: 'python', git: 'python', sql: 'data', 'data-eng': 'data', web: 'web', stats: 'stats', r: 'stats', sheets: 'sheet' };

export const trainingKindOf = (track: Track): TrainingKind => KIND[track];

/** The scene for the player's owed training; code is the default (an optional visit has no weakness to read). */
export function trainingKind(save: SaveData): TrainingKind {
  const w = requiredTraining(save) ?? save.training.weaknesses.find((x) => x.status === 'training');
  const skill = w?.skillIds[0];
  return skill ? trainingKindOf(trackOfSkillId(skill)) : 'python';
}
