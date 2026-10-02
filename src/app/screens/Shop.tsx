import { items } from '../../content/world';
import { buyItem } from '../../game/actions';
import { useGame } from '../../game/store';

/** The goods on sale (cosmetics only: nothing here sells answers, hints, XP or Focus). Used by the shop screen and by the shop in the 3D world. */
export function ShopGrid() {
  const game = useGame();
  const { save } = game;
  return (
    <div class="shop-grid">
      {items.filter((i) => i.price !== null).map((item) => {
        const owned = save.inventory[item.id] ?? 0;
        const maxed = item.kind === 'cosmetic' && owned > 0;
        const cant = save.stats.coins < (item.price ?? 0);
        return (
          <div class="shop-item" key={item.id} data-testid={`item-${item.id}`}>
            <div class="item-icon">{item.icon}</div>
            <strong>{item.name}</strong>
            <span class="muted small">{item.description}</span>
            <button class="btn small" disabled={maxed || cant} onClick={() => game.apply(buyItem(save, item.id))} data-testid={`buy-${item.id}`}>
              {maxed ? 'Owned' : `Buy for 🪙 ${item.price}`}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function Shop() {
  const { save } = useGame();
  return (
    <main class="scene theme-shop" data-testid="shop">
      <div class="scene-card">
        <h1 class="scene-title">🛒 Bolt &amp; Barrel Shop</h1>
        <p class="muted">“Snacks, tea and style, friend. I do not sell answers. Nobody does.” <span class="coins">🪙 {save.stats.coins}</span></p>
        <ShopGrid />
      </div>
    </main>
  );
}
