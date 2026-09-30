import { acts, ENDING } from '../../content/campaign';
import { bosses, type BossDef } from '../../content/bosses';
import { bossLockReason, bossStatus, campaignProgress, retryIsNewVersion, sealingWeakness } from '../../game/boss';
import { activePlan, startTraining } from '../../game/training';
import { getStore, useGame } from '../../game/store';
import { getSkill } from '../../content';

const STATUS_LABEL = { locked: 'Locked', ready: 'Ready', sealed: 'Training needed', passed: 'Defeated' } as const;

/**
 * The Summit's Boss Hall: the whole campaign in one place. Every boss is hint-free and one attempt at a time; a miss
 * leads to diagnosis, training and a NEW version. Nothing here is a level or XP gate: a boss opens when its lessons are
 * done, because that is when the evidence says the player has met everything it uses.
 */
export function BossHall({ onOpenBoss, onOpenPlan }: { onOpenBoss: (id: string) => void; onOpenPlan: (planId: string) => void }) {
  const { save } = useGame();
  const prog = campaignProgress(save);
  const train = (boss: BossDef) => {
    const st = getStore();
    const w = sealingWeakness(st.save, boss);
    if (!w) return;
    st.apply(startTraining(st.save, w.id, { kind: 'boss', bossId: boss.id }));
    const p = activePlan(getStore().save);
    if (p) onOpenPlan(p.id);
  };
  return (
    <main class="scene theme-summit" data-testid="boss-hall">
      <div class="scene-card">
        <h1>🏔️ The Summit</h1>
        <p class="tagline">Face the guardians, then the Great Outage.</p>
        <p class="muted small" data-testid="campaign-progress">{prog.passed} of {prog.total} trials cleared. Bosses are unfamiliar problems with no hints and one attempt at a time. If one goes wrong, you get a diagnosis, training that targets it, and a new problem: never the same one twice.</p>
        {prog.done && (
          <section class="panel" data-testid="campaign-ending">
            <h2>🏔️ {ENDING.title}</h2>
            <p>{ENDING.body}</p>
          </section>
        )}
        {acts.map((act) => {
          const boss = bosses.find((b) => b.id === act.bossId);
          if (!boss) return null;
          const status = bossStatus(save, boss);
          const w = sealingWeakness(save, boss);
          return (
            <section key={act.id} class={`panel boss boss-${status}`} data-testid={`boss-${boss.id}`} data-status={status}>
              <div class="row-between">
                <h2>{boss.icon} {boss.title}</h2>
                <span class={`chip status-${status}`}>{STATUS_LABEL[status]}</span>
              </div>
              <p class="muted small"><b>{act.title}.</b> {act.story}</p>
              {status !== 'locked' && <p>{status === 'passed' ? boss.victory : boss.intro}</p>}
              {status === 'locked' && <p class="callout small" data-testid="boss-lock-reason">{bossLockReason(save, boss)}</p>}
              {status === 'sealed' && w && (
                <div class="callout small" data-testid="boss-sealed">
                  <p>{boss.defeat}</p>
                  <p>What the attempt showed: {w.reasons[0] ?? 'the skills it tests need another look'}. Skills: {w.skillIds.map((k) => getSkill(k)?.title ?? k).join(', ')}.</p>
                  <button class="btn gold" onClick={() => train(boss)} data-testid={`boss-train-${boss.id}`}>Start the training →</button>
                </div>
              )}
              {status === 'ready' && (
                <button class="btn gold" onClick={() => onOpenBoss(boss.id)} data-testid={`boss-open-${boss.id}`}>{retryIsNewVersion(save, boss) ? 'Face a new version →' : 'Face it →'}</button>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
