/**
 * BOSS state transitions (pure: (save, ...) => { save, events }).
 *
 * The remediation model, in short:
 *  - every boss version is ONE attempt with no hints and no starter code;
 *  - a failed attempt is ordinary evidence: it is diagnosed, a weakness is recorded and the boss is SEALED until the
 *    matching training is complete (or the weakness is resolved by an independent pass elsewhere);
 *  - after that the boss offers a NEW version (a different problem and different data), never the same problem again;
 *  - beating a boss earns rewards and story progress, and it is recorded as independent evidence. It never sets a skill
 *    to "mastered": only the evidence does (learning/mastery.ts).
 * A failure costs Focus (a mini-boss level 4, a mastery boss or the Summit level 5: see game/focus.ts) and the boss cannot
 * be attempted below 100 Focus; training earns it back. There is no lockout timer and no Rest.
 */
import { bossChallengeFor, bosses, getBoss, type BossDef, type BossRoute } from '../content/bosses';
import type { Challenge } from '../content/schema';
import { getSkill } from '../content';
import type { BossState, SaveData, Weakness } from '../core/save';
import type { FailureDetail } from '../learning/mastery';
import { draft, gain, settle, type Result } from './actions';
import { buildEvidence } from './evidence';
import { ensureRequiredPlan } from './training';
import { FAILURE_LEVELS, failureLevelOf, focusReady, loseFocus } from './focus';
import { applyDiagnosis, resolveOnPass, upsertWeakness } from './weakness';
import { emitWorldEffects } from './worldEvents';
import { diagnoseBossFailure, maxSeverity, SEVERITY_ORDER } from './diagnosis';

export type BossStatus = 'locked' | 'ready' | 'sealed' | 'passed';

const now = () => new Date().toISOString();

export function bossState(save: SaveData, bossId: string): BossState {
  return save.bosses[bossId] ?? { attempts: [] };
}

export const isBossPassed = (save: SaveData, bossId: string): boolean => !!save.bosses[bossId]?.passedAt;

/** Why a boss cannot be faced yet, in plain words (empty when it can). */
export function bossLockReason(save: SaveData, boss: BossDef): string {
  const lessons = boss.requiresLessons.filter((id) => !save.learning.lessons[id]?.completed);
  if (lessons.length) return 'Finish the trial lesson that comes before it (and any training it asks for).';
  const need = boss.requiresBosses.filter((id) => !isBossPassed(save, id));
  if (need.length) return `Defeat ${need.map((id) => getBoss(id)?.title ?? id).join(', ')} first.`;
  if (boss.requiresAnyOf) {
    const have = boss.requiresAnyOf.bosses.filter((id) => isBossPassed(save, id)).length;
    if (have < boss.requiresAnyOf.count) return `Defeat any ${boss.requiresAnyOf.count} of the mastery guardians (${have} so far). Choose the technologies you want to be tested in.`;
  }
  if (boss.routes && !openRoutes(save, boss).length) return `Open a route by defeating the guardian of a technology: ${boss.routes.map((r) => `${r.title} needs ${r.needs.map((id) => getBoss(id)?.title ?? id).join(' and ')}`).join('; ')}.`;
  return '';
}

/** Routes of a boss the player has earned (every guardian the route needs is defeated). A boss without routes has none. */
export const openRoutes = (save: SaveData, boss: BossDef): BossRoute[] => (boss.routes ?? []).filter((r) => r.needs.every((id) => isBossPassed(save, id)));

/** The route a version belongs to. */
export const routeOfVersion = (boss: BossDef, version: string): BossRoute | undefined => boss.routes?.find((r) => r.versions.includes(version));

/** The route to offer by default: the one last attempted (if still open), otherwise the first open route. */
export function defaultRoute(save: SaveData, boss: BossDef): BossRoute | undefined {
  const open = openRoutes(save, boss);
  const last = bossState(save, boss.id).attempts.at(-1);
  const lastRoute = last ? routeOfVersion(boss, last.version) : undefined;
  return open.find((r) => r.id === lastRoute?.id) ?? open[0];
}

/** The weakness that seals the boss, while its training is still owed. */
export function sealingWeakness(save: SaveData, boss: BossDef): Weakness | undefined {
  const st = save.bosses[boss.id];
  if (!st?.remediationWeaknessId) return undefined;
  const w = save.training.weaknesses.find((x) => x.id === st.remediationWeaknessId);
  if (!w || w.status === 'resolved') return undefined;
  const planDone = w.planIds.some((id) => save.training.plans.find((p) => p.id === id)?.status === 'complete');
  return planDone ? undefined : w;
}

export function bossStatus(save: SaveData, boss: BossDef): BossStatus {
  if (isBossPassed(save, boss.id)) return 'passed';
  if (bossLockReason(save, boss)) return 'locked';
  return sealingWeakness(save, boss) ? 'sealed' : 'ready';
}

/** The version to offer next: one never attempted if any, otherwise the one attempted longest ago (content grows, so this is rare). */
export function nextVersion(save: SaveData, boss: BossDef, routeId?: string): string {
  const tried = bossState(save, boss.id).attempts;
  const route = boss.routes ? (boss.routes.find((r) => r.id === routeId && openRoutes(save, boss).some((o) => o.id === r.id)) ?? defaultRoute(save, boss)) : undefined;
  const versions = route?.versions ?? boss.versions;
  const fresh = versions.find((v) => !tried.some((a) => a.version === v));
  if (fresh) return fresh;
  return [...versions].sort((a, b) => lastIndex(tried, a) - lastIndex(tried, b))[0]!;
}
const lastIndex = (tried: BossState['attempts'], v: string) => tried.map((a) => a.version).lastIndexOf(v);

export function currentBossChallenge(save: SaveData, boss: BossDef, routeId?: string): Challenge | undefined {
  return bossChallengeFor(boss.id, nextVersion(save, boss, routeId));
}

/** True when this boss has an attempted version that a fresh retry will replace. */
export const retryIsNewVersion = (save: SaveData, boss: BossDef): boolean => bossState(save, boss.id).attempts.length > 0 && boss.versions.length > 1;

/** Human summary of the skills a boss tests, for the hall. */
export const bossSkillTitles = (boss: BossDef): string[] => {
  const ids = new Set<string>();
  for (const v of boss.versions) for (const k of bossChallengeFor(boss.id, v)?.skillIds ?? []) ids.add(k);
  return [...ids].map((k) => getSkill(k)?.title ?? k);
};

/**
 * The single graded submission of the current version. Returns no change when the boss is locked, sealed or already
 * beaten. `weaknessId` of a failure is stored on the boss so the UI can offer the training.
 */
export function submitBoss(save: SaveData, bossId: string, passed: boolean, timeMs: number, detail?: FailureDetail, routeId?: string): Result {
  const { s, events } = draft(save);
  const boss = getBoss(bossId);
  if (!boss || bossStatus(s, boss) !== 'ready' || !focusReady(s)) return { save: s, events };
  const version = nextVersion(s, boss, routeId);
  const c = bossChallengeFor(boss.id, version);
  if (!c) return { save: s, events };

  const at = now();
  const record = buildEvidence(s, c, { passed, at, timeMs, hintsUsed: 0, lookups: 0, attemptNumber: 1, source: 'boss', detail, forceIndependent: true, boss: { bossId, version } });
  emitWorldEffects(s, events, c, passed);
  s.evidence.push(record);
  const st = (s.bosses[bossId] ??= { attempts: [] });
  const attempt = { version, challengeId: c.id, at, passed, weaknessIds: [] as string[] };
  st.attempts.push(attempt);

  if (passed) {
    st.passedAt = at;
    delete st.remediationWeaknessId;
    delete st.remediationPlanId;
    gain(s, events, boss.reward.xp, boss.reward.coins, boss.title);
    if (boss.reward.item) {
      s.inventory[boss.reward.item] = (s.inventory[boss.reward.item] ?? 0) + 1;
      events.push({ type: 'item', id: boss.reward.item });
    }
    events.push({ type: 'bossPassed', id: bossId });
    if (boss.kind === 'summit' && !s.campaign.completedAt) {
      s.campaign.completedAt = at;
      events.push({ type: 'campaignComplete' });
    }
    resolveOnPass(s, events, record);
  } else {
    // A boss failure is always worth a look: the diagnosis records what the attempt showed and starts the training.
    const w = applyDiagnosis(s, events, c, record) ?? upsertWeakness(s, events, diagnoseBossFailure(s, c), record, at);
    // Failing a boss again is strong evidence of a real gap: confidence (and so the depth of training) grows with each miss.
    const misses = st.attempts.filter((a) => !a.passed).length;
    w.failures = Math.max(w.failures, misses);
    w.severity = maxSeverity(w.severity, SEVERITY_ORDER[Math.min(SEVERITY_ORDER.length - 1, misses)]!);
    attempt.weaknessIds.push(w.id);
    st.remediationWeaknessId = w.id;
    w.required = true;
    const level = failureLevelOf(c, boss.kind);
    w.focusLevel = Math.max(w.focusLevel ?? 0, level);
    loseFocus(s, events, FAILURE_LEVELS[level].loss);
    ensureRequiredPlan(s, events, w, { kind: 'boss', bossId });
    const plan = s.training.plans.find((p) => p.weaknessId === w.id && p.status === 'active');
    if (plan) s.bosses[bossId]!.remediationPlanId = plan.id;
    events.push({ type: 'bossFailed', id: bossId });
  }
  settle(s, events);
  return { save: s, events };
}

/** Counts for the hall header and the campaign progress line. */
export function campaignProgress(save: SaveData): { passed: number; total: number; done: boolean } {
  return { passed: bosses.filter((b) => isBossPassed(save, b.id)).length, total: bosses.length, done: !!save.campaign.completedAt };
}
