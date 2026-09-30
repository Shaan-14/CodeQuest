/**
 * THE TRAINING BOARD: what the game thinks the player should practise, in a fixed priority order:
 *   1 demonstrated weaknesses  2 weak combinations  3 recently quiet/forgotten skills  4 prerequisites for what is next
 *   5 older skills worth a review.
 * Every need has a plain-language reason. Needs that are not yet weaknesses (quiet, prerequisite, review, boss prep)
 * become one (with an honest source) when the player starts them. Nothing here changes curriculum progress.
 */
import { getSkill, lessons } from '../content';
import type { Severity, SaveData, Weakness, WeaknessKind, WeaknessSource } from '../core/save';
import { summarizeSkill } from '../learning/mastery';
import { lessonStatus, nextLesson } from './lessons';
import { reviewsDue } from './retention';
import { challenges } from '../content';
import { nextTrainingId } from './weakness';
import { draft, type Result } from './actions';
import { independentPassesOn } from './evidence';

export type NeedCategory = 1 | 2 | 3 | 4 | 5;

export interface TrainingNeed {
  id: string;
  category: NeedCategory;
  kind: WeaknessKind;
  source: WeaknessSource;
  skillIds: string[];
  title: string;
  reason: string;
  severity: Severity;
  /** Present for needs that are already recorded weaknesses. */
  weaknessId?: string;
}

const title = (ids: string[]) => ids.map((i) => getSkill(i)?.title ?? i).join(' + ');
const skillsOfChallengeFn = (id: string) => challenges.find((c) => c.id === id)?.skillIds;

export function trainingNeeds(save: SaveData, nowMs: number): TrainingNeed[] {
  const needs: TrainingNeed[] = [];
  const covered = new Set<string>();
  const open = save.training.weaknesses.filter((w) => w.status !== 'resolved');
  // 1 + 2: recorded weaknesses (combinations second, then by severity).
  const sevRank: Record<Severity, number> = { major: 0, serious: 1, moderate: 2, minor: 3 };
  const sorted = [...open].sort((a, b) => (a.kind === 'combination' ? 1 : 0) - (b.kind === 'combination' ? 1 : 0) || sevRank[a.severity] - sevRank[b.severity] || a.detectedAt.localeCompare(b.detectedAt));
  for (const w of sorted) {
    w.skillIds.forEach((k) => covered.add(k));
    needs.push({ id: `w:${w.id}`, category: w.kind === 'combination' ? 2 : 1, kind: w.kind, source: w.source, skillIds: w.skillIds, severity: w.severity, weaknessId: w.id, title: w.kind === 'combination' ? `Combining: ${title(w.skillIds)}` : `Strengthen: ${title(w.skillIds)}`, reason: w.reasons.join('; ') || 'Your recent work showed something to practise.' });
  }
  // 3: quiet skills (time-based; independent of failures).
  for (const d of reviewsDue(save, nowMs, skillsOfChallengeFn)) {
    if (covered.has(d.skill.id)) continue;
    covered.add(d.skill.id);
    needs.push({ id: `q:${d.skill.id}`, category: 3, kind: 'rust', source: 'quiet', skillIds: [d.skill.id], severity: 'minor', title: `Warm up: ${d.skill.title}`, reason: d.reason });
  }
  // 4: prerequisites for the next lesson that were only ever guided (foundations that would make it harder).
  const next = nextLesson(save);
  if (next) {
    const wanted = new Set<string>();
    for (const st of next.steps) if (st.kind === 'challenge') for (const k of challenges.find((c) => c.id === st.challengeId)?.skillIds ?? []) wanted.add(k);
    wanted.add(next.skillId);
    for (const k of wanted) for (const p of getSkill(k)?.prerequisites ?? []) {
      if (covered.has(p)) continue;
      const sk = getSkill(p);
      if (!sk) continue;
      const st = summarizeSkill(save.evidence, sk).status;
      if (st === 'guided' || st === 'attempted') {
        covered.add(p);
        needs.push({ id: `p:${p}`, category: 4, kind: 'prerequisite', source: 'upcoming', skillIds: [p], severity: 'minor', title: `Before “${next.title}”: ${sk.title}`, reason: `“${next.title}” builds on ${sk.title}, and so far you have only shown it with help. A short independent problem now will make the lesson smoother. You stay where you are in the story.` });
      }
    }
  }
  // 5: older skills that were learned but never shown independently and are not in any other need.
  for (const sk of Object.values(Object.fromEntries(lessons.map((l) => [l.skillId, getSkill(l.skillId)])))) {
    if (!sk || covered.has(sk.id)) continue;
    const learned = lessons.some((l) => l.skillId === sk.id && lessonStatus(save, l) === 'complete');
    if (!learned) continue;
    const st = summarizeSkill(save.evidence, sk).status;
    if (st === 'guided' || st === 'developing') {
      covered.add(sk.id);
      needs.push({ id: `r:${sk.id}`, category: 5, kind: 'review', source: 'quiet', skillIds: [sk.id], severity: 'minor', title: `Prove it: ${sk.title}`, reason: st === 'guided' ? `You have only solved ${sk.title} problems with guidance so far. A fresh independent problem turns that into evidence.` : `${sk.title} is developing: a few more independent solves in new settings would demonstrate it.` });
    }
  }
  return needs.sort((a, b) => a.category - b.category);
}

/** Record a non-weakness need as a weakness (so it has history), then the caller starts training on it. */
export function recordNeed(save: SaveData, need: TrainingNeed): Result & { weaknessId?: string } {
  const { s, events } = draft(save);
  if (need.weaknessId) return { save: s, events, weaknessId: need.weaknessId };
  const at = new Date().toISOString();
  const existing = s.training.weaknesses.find((w) => w.key === need.skillIds.slice().sort().join('+') && w.status !== 'resolved');
  if (existing) return { save: s, events, weaknessId: existing.id };
  const w: Weakness = {
    id: nextTrainingId(s, 'w'), key: need.skillIds.slice().sort().join('+'), skillIds: need.skillIds, kind: need.kind, severity: need.severity, status: 'open', source: need.source,
    exposedBy: { challengeId: '', objectiveId: '', context: '', at }, detectedAt: at, failures: 0, hintsUsed: 0, hintLevels: [], mistakes: [], reasons: [need.reason], previousIndependent: independentPassesOn(s.evidence, need.skillIds), struggledIn: [], planIds: [],
  };
  s.training.weaknesses.push(w);
  return { save: s, events, weaknessId: w.id };
}
