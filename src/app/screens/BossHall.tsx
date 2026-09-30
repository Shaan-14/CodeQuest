import { acts, ENDING } from '../../content/campaign';
import { bosses } from '../../content/bosses';
import { bossLockReason, bossStatus, campaignProgress, isBossPassed, openRoutes, retryIsNewVersion, sealingWeakness } from '../../game/boss';
import { useGame } from '../../game/store';
import { DiagnosisCard } from '../components/DiagnosisCard';

const STATUS_LABEL = { locked: 'Locked', ready: 'Ready', sealed: 'Training needed', passed: 'Defeated' } as const;

/**
 * The Summit's Boss Hall: the whole campaign in one place. Every boss is hint-free and one attempt at a time; a miss
 * leads to diagnosis, training and a NEW version. Nothing here is a level or XP gate: a boss opens when its lessons are
 * done, because that is when the evidence says the player has met everything it uses.
 */
export function BossHall({ onOpenBoss, onGoTraining }: { onOpenBoss: (id: string) => void; onGoTraining: () => void }) {
  const { save } = useGame();
  const prog = campaignProgress(save);
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
                <div data-testid="boss-sealed">
                  <p class="callout small">{boss.defeat}</p>
                  <DiagnosisCard weakness={w} onGoTraining={onGoTraining} />
                </div>
              )}
              {boss.requiresAnyOf && status !== 'passed' && (
                <p class="small" data-testid="boss-any-of">Guardians defeated toward this trial: {boss.requiresAnyOf.bosses.filter((id) => isBossPassed(save, id)).length} of {boss.requiresAnyOf.count} needed, from any of the technologies.</p>
              )}
              {boss.routes && status === 'ready' && <p class="small muted" data-testid="boss-open-routes">Routes open to you: {openRoutes(save, boss).map((r) => r.title).join(' · ')}</p>}
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
