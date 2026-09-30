import { useState } from 'preact/hooks';
import { getSkill } from '../../content';
import { getBoss } from '../../content/bosses';
import { bossStatus, currentBossChallenge, sealingWeakness, submitBoss } from '../../game/boss';
import { getStore, useGame } from '../../game/store';
import { failureDetailOf } from '../../learning/failure';
import { ChallengeStepView } from '../components/ChallengeStep';

/**
 * One boss attempt. The problem is chosen by the game (a version never attempted before), has no hints and no starter
 * code, and is graded once: after Submit the outcome is final for this version. The result is ordinary evidence.
 */
export function BossRun({ bossId, onBack, onTrain }: { bossId: string; onBack: () => void; onTrain: (weaknessId: string) => void }) {
  const { save } = useGame();
  const boss = getBoss(bossId);
  const [begun, setBegun] = useState(false);
  const [outcome, setOutcome] = useState<'passed' | 'failed' | null>(null);
  if (!boss) return <main class="scene"><div class="scene-card"><p>That boss does not exist.</p><button class="btn" onClick={onBack}>Back</button></div></main>;
  const status = bossStatus(save, boss);
  const c = currentBossChallenge(save, boss);
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
          {w && <p>What the attempt showed: {w.reasons[0] ?? 'these skills need another look'} ({w.skillIds.map((k) => getSkill(k)?.title ?? k).join(', ')}). Nothing you had before is lost, and there is no penalty or timer.</p>}
          {w && <button class="btn gold" onClick={() => onTrain(w.id)} data-testid="boss-train">Start the training →</button>}
          <button class="btn ghost" onClick={onBack}>Back to the Summit</button>
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
          store.apply(submitBoss(store.save, boss.id, graded.passed, ms, failureDetailOf(graded)));
          setOutcome(graded.passed ? 'passed' : 'failed');
        }}
      />
    </main>
  );
}
