import { useState } from 'preact/hooks';
import { getBoss } from '../../content/bosses';
import { bossStatus, currentBossChallenge, defaultRoute, openRoutes, sealingWeakness, submitBoss } from '../../game/boss';
import { getStore, useGame } from '../../game/store';
import { failureDetailOf } from '../../learning/failure';
import { ChallengeStepView } from '../components/ChallengeStep';
import { DiagnosisCard } from '../components/DiagnosisCard';

/**
 * One boss attempt. The problem is chosen by the game (a version never attempted before), has no hints and no starter
 * code, and is graded once: after Submit the outcome is final for this version. The result is ordinary evidence.
 */
export function BossRun({ bossId, onBack, onGoTraining }: { bossId: string; onBack: () => void; onGoTraining: () => void }) {
  const { save } = useGame();
  const boss = getBoss(bossId);
  const [begun, setBegun] = useState(false);
  const [routeId, setRouteId] = useState<string | undefined>(undefined);
  const [outcome, setOutcome] = useState<'passed' | 'failed' | null>(null);
  if (!boss) return <main class="scene"><div class="scene-card"><p>That boss does not exist.</p><button class="btn" onClick={onBack}>Back</button></div></main>;
  const status = bossStatus(save, boss);
  const routes = boss.routes ? openRoutes(save, boss) : [];
  const chosen = boss.routes ? (routes.find((r) => r.id === routeId) ?? defaultRoute(save, boss)) : undefined;
  const c = currentBossChallenge(save, boss, chosen?.id);
  const w = sealingWeakness(save, boss);
  const head = <div class="lesson-head"><button class="btn small ghost" onClick={onBack} data-testid="boss-back">← Back to the Summit</button><h1>{boss.icon} {boss.title}</h1></div>;

  if (outcome === 'passed' || status === 'passed') {
    return (
      <main class="lesson" data-testid="boss-run" data-status="passed">
        {head}
        <section class="panel" data-testid="boss-victory"><h2>👑 Defeated</h2><p>{boss.victory}</p><p class="muted small">+{boss.reward.xp} XP, +{boss.reward.coins} coins. This counts as independent evidence for the skills it used; mastery still comes from varied evidence over time.</p><button class="btn gold" onClick={onBack}>Back to the Summit</button></section>
      </main>
    );
  }
  if (outcome === 'failed' || status === 'sealed') {
    return (
      <main class="lesson" data-testid="boss-run" data-status="sealed">
        {head}
        <section class="panel" data-testid="boss-defeat">
          <h2>🩹 Not yet</h2>
          <p>{boss.defeat}</p>
          <p class="muted small">This boss is sealed until you finish training. Nothing you had before is lost, and there is no penalty or timer.</p>
          {w ? <DiagnosisCard weakness={w} onGoTraining={onGoTraining} /> : <button class="btn ghost" onClick={onBack}>Back to the Summit</button>}
        </section>
      </main>
    );
  }
  if (status === 'locked' || !c) return <main class="lesson">{head}<p class="muted">This boss is not available yet.</p></main>;

  if (!begun) {
    return (
      <main class="lesson" data-testid="boss-run" data-status="ready">
        {head}
        <section class="panel">
          <p>{boss.intro}</p>
          {routes.length > 0 && (
            <fieldset class="routes" data-testid="boss-routes">
              <legend>Choose the technology you will be tested in</legend>
              {routes.map((r) => (
                <label key={r.id} class={`route ${chosen?.id === r.id ? 'chosen' : ''}`}>
                  <input type="radio" name="route" checked={chosen?.id === r.id} onChange={() => setRouteId(r.id)} data-testid={`boss-route-${r.id}`} />
                  <span><strong>{r.title}</strong><br /><span class="muted small">{r.blurb}</span></span>
                </label>
              ))}
            </fieldset>
          )}
          <ul class="muted small"><li>No hints, no starter code, no example output.</li><li>Run as often as you like; you get one graded submission.</li><li>If it goes wrong you get a diagnosis and training, then a different problem. Nothing is lost.</li></ul>
          <button class="btn gold" onClick={() => setBegun(true)} data-testid="boss-begin">Begin</button>
        </section>
      </main>
    );
  }
  const store = getStore();
  return (
    <main class="lesson" data-testid="boss-run" data-status="active" data-challenge={c.id}>
      {head}
      <ChallengeStepView
        key={c.id}
        challenge={c}
        onReady={() => undefined}
        onGoAcademy={onBack}
        noHints
        submitOverride={(graded, ms) => {
          store.apply(submitBoss(store.save, boss.id, graded.passed, ms, failureDetailOf(graded), chosen?.id));
          setOutcome(graded.passed ? 'passed' : 'failed');
        }}
      />
    </main>
  );
}
