import { lazy, Suspense } from 'preact/compat';
import { useState } from 'preact/hooks';
import { BossHall } from '../../app/screens/BossHall';

const BossRun = lazy(() => import('../../app/screens/BossRun').then((m) => ({ default: m.BossRun })));

/**
 * The Outage Console: the Boss Hall and the boss trials themselves, the same hint-free, one-attempt, new-version-after-training rules as
 * in the classic view. Only the place changed: winning lights a beacon you can see.
 */
export function BossOverlay({ onClose, onGoTraining, start }: { onClose: () => void; onGoTraining: () => void; start?: string | null }) {
  const [bossId, setBossId] = useState<string | null>(start ?? null);
  return (
    <div class="play-terminal" role="dialog" aria-label="Outage console" data-testid="play-boss">
      <div class="term-head">
        <h2>🏔️ Outage Console</h2>
        {bossId && <button class="btn small" onClick={() => setBossId(null)} data-testid="boss-hall-back">Boss Hall</button>}
        <button class="btn small gold" onClick={onClose} data-testid="boss-overlay-close">Step away</button>
      </div>
      <div class="term-body">
        <Suspense fallback={<p class="muted">Loading…</p>}>
          {bossId ? <BossRun bossId={bossId} onBack={() => setBossId(null)} onGoTraining={onGoTraining} /> : <BossHall onOpenBoss={setBossId} onGoTraining={onGoTraining} />}
        </Suspense>
      </div>
    </div>
  );
}
