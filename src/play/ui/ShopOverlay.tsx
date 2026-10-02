import { useEffect } from 'preact/hooks';
import { useGame } from '../../game/store';
import { ShopGrid } from '../../app/screens/Shop';

/** The Bolt & Barrel kiosk in the plaza: the same goods and the same purchase rule as the shop screen (cosmetics only, bought with coins). */
export function ShopOverlay({ onClose }: { onClose: () => void }) {
  const { save } = useGame();
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div class="play-terminal" role="dialog" aria-label="Bolt and Barrel shop" data-testid="play-shop">
      <div class="term-head">
        <h2>🛒 Bolt &amp; Barrel</h2>
        <button class="btn small gold" onClick={onClose} data-testid="shop-close">Leave the shop</button>
      </div>
      <div class="term-body">
        <p class="muted">“Style, not shortcuts. I do not sell answers, hints or Focus: nobody does.” <span class="coins" data-testid="shop-coins">🪙 {save.stats.coins}</span></p>
        <ShopGrid />
        <p class="muted small">What you buy is worn at once. Change it any time in your Pack (I).</p>
      </div>
    </div>
  );
}
