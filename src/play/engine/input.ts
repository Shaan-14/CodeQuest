/** Keyboard and mouse input for the 3D view. It listens only while `enabled` (an open terminal or dialogue must receive typing, not movement). */
export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();
  enabled = true;
  /** Mouse camera drag since last read (radians). */
  dragX = 0; dragY = 0; wheel = 0;
  private dragging = false;
  /** Mouse look without clicking: the pointer is captured by the game (Esc releases it). Falls back to click-and-drag where capture is unavailable. */
  locked = false;
  /** Called when the player releases the mouse themselves (Esc) while the world was listening: the game opens its menu. */
  onLockLost?: () => void;
  onLockChange?: (locked: boolean) => void;
  private releasing = false;
  /** The player pushed the mouse up past the top of the screen: the game gave the cursor back so the menu bar can be clicked. Moving back over the world captures it again. */
  revealed = false;
  onReveal?: (on: boolean) => void;
  /** A virtual cursor row while captured: it drifts back to the middle, so only a sustained push upward (a "go to the menu" gesture) reaches the top. */
  private vy = 0; private vyAt = 0;
  /** While revealed: the cursor has been over the menu bar, so coming back to the world means "play again" (otherwise it would re-capture at once). */
  private sawUi = false; private revealAt = 0;
  private el: HTMLElement;
  private onKey: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onBlur = () => this.down.clear();
  private cleanup: (() => void)[] = [];

  constructor(el: HTMLElement) {
    this.el = el;
    // Movement keys never fire while typing in an input, textarea or code editor.
    const typing = (t: EventTarget | null) => { const n = t as HTMLElement | null; return !!n && (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.isContentEditable || !!n.closest?.('.cm-editor')); };
    this.onKey = (e) => {
      if (!this.enabled || typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (!this.locked) this.requestLock(); // a key press is a user gesture: the first one captures the mouse
      if (['w', 'a', 's', 'd', 'e', 'q', ' ', 'Shift', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'Tab', 'm', 'j', 'i', 'f', 'h'].includes(k)) {
        if (k !== 'Tab' && k !== 'Escape') e.preventDefault();
        if (!this.down.has(k)) this.pressed.add(k);
        this.down.add(k);
      }
    };
    this.onKeyUp = (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; this.down.delete(k); };
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    const onHud = (e: Event) => !!(e.target as HTMLElement | null)?.closest?.('.ghud-menu, .ghud-card');
    const md = (e: PointerEvent) => { if (!this.enabled || onHud(e)) return; if (!this.locked) this.requestLock(); this.dragging = true; el.setPointerCapture?.(e.pointerId); };
    const mu = (e: PointerEvent) => { this.dragging = false; el.releasePointerCapture?.(e.pointerId); };
    const mm = (e: PointerEvent) => {
      if (!this.enabled) return;
      if (!this.locked && this.revealed) { if (this.sawUi && !onHud(e)) this.requestLock(); return; } // back over the world: capture again (the next click does it if the browser wants a gesture)
      if (!(this.dragging || this.locked)) return;
      this.dragX += e.movementX * 0.006; this.dragY += e.movementY * 0.004;
      if (this.locked) {
        const mid = window.innerHeight * 0.4, now = performance.now();
        this.vy = mid + (this.vy - mid) * Math.exp(-Math.min(0.1, (now - this.vyAt) / 1000) * 1.2) + e.movementY; this.vyAt = now;
        if (this.vy < 0) this.reveal();
      }
    };
    const over = (e: PointerEvent) => { if (this.revealed && performance.now() - this.revealAt > 350 && (e.target as HTMLElement | null)?.closest?.('.ghud-menu, .ghud-card')) this.sawUi = true; };
    window.addEventListener('pointermove', over, true);
    this.cleanup.push(() => window.removeEventListener('pointermove', over, true));
    const wh = (e: WheelEvent) => { if (!this.enabled) return; e.preventDefault(); this.wheel += Math.sign(e.deltaY); };
    const pl = () => {
      const now = document.pointerLockElement === el;
      const lost = this.locked && !now;
      this.locked = now; if (now) { this.dragging = false; this.vy = window.innerHeight * 0.4; this.vyAt = performance.now(); this.setRevealed(false); }
      this.onLockChange?.(now);
      if (lost && !this.releasing && this.enabled) this.onLockLost?.();
      this.releasing = false;
    };
    document.addEventListener('pointerlockchange', pl);
    el.addEventListener('pointerdown', md); el.addEventListener('pointerup', mu); el.addEventListener('pointermove', mm); el.addEventListener('wheel', wh, { passive: false });
    this.cleanup.push(() => { document.removeEventListener('pointerlockchange', pl); el.removeEventListener('pointerdown', md); el.removeEventListener('pointerup', mu); el.removeEventListener('pointermove', mm); el.removeEventListener('wheel', wh); });
  }

  /** Capture the mouse (needs a recent click or key press; fails quietly otherwise, and the next one tries again). */
  requestLock(): void {
    if (!this.enabled || this.locked || typeof this.el.requestPointerLock !== 'function') return;
    try { const r = this.el.requestPointerLock() as unknown as Promise<void> | undefined; r?.catch?.(() => undefined); } catch { /* not allowed right now */ }
  }
  private setRevealed(on: boolean): void { if (on) { this.sawUi = false; this.revealAt = performance.now(); } if (this.revealed !== on) { this.revealed = on; this.onReveal?.(on); } }
  /** Hand the cursor back so the top bar can be used, without opening the pause menu. */
  reveal(): void { if (document.pointerLockElement !== this.el) return; this.releasing = true; this.setRevealed(true); document.exitPointerLock(); }
  /** Give the mouse back (an overlay needs the cursor). */
  releaseLock(): void { this.setRevealed(false); if (document.pointerLockElement === this.el) { this.releasing = true; document.exitPointerLock(); } }

  isDown(...keys: string[]): boolean { return keys.some((k) => this.down.has(k)); }
  /** True once per key press. */
  wasPressed(...keys: string[]): boolean { let hit = false; for (const k of keys) if (this.pressed.delete(k)) hit = true; return hit; }
  endFrame(): void { this.pressed.clear(); this.dragX = 0; this.dragY = 0; this.wheel = 0; }
  /** Virtual press (on-screen buttons and tests). */
  press(k: string): void { this.pressed.add(k); }
  hold(k: string, on: boolean): void { if (on) this.down.add(k); else this.down.delete(k); }
  clear(): void { this.down.clear(); this.pressed.clear(); }
  dispose(): void {
    window.removeEventListener('keydown', this.onKey); window.removeEventListener('keyup', this.onKeyUp); window.removeEventListener('blur', this.onBlur);
    for (const c of this.cleanup) c();
  }
}
