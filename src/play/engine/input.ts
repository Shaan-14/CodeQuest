/** Keyboard and mouse input for the 3D view. It listens only while `enabled` (an open terminal or dialogue must receive typing, not movement). */
export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();
  enabled = true;
  /** Mouse camera drag since last read (radians). */
  dragX = 0; dragY = 0; wheel = 0;
  private dragging = false;
  private onKey: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onBlur = () => this.down.clear();
  private cleanup: (() => void)[] = [];

  constructor(el: HTMLElement) {
    // Movement keys never fire while typing in an input, textarea or code editor.
    const typing = (t: EventTarget | null) => { const n = t as HTMLElement | null; return !!n && (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.isContentEditable || !!n.closest?.('.cm-editor')); };
    this.onKey = (e) => {
      if (!this.enabled || typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (['w', 'a', 's', 'd', 'e', 'q', ' ', 'Shift', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'Tab', 'm', 'j', 'f', 'h'].includes(k)) {
        if (k !== 'Tab' && k !== 'Escape') e.preventDefault();
        if (!this.down.has(k)) this.pressed.add(k);
        this.down.add(k);
      }
    };
    this.onKeyUp = (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; this.down.delete(k); };
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    const md = (e: PointerEvent) => { if (!this.enabled) return; this.dragging = true; el.setPointerCapture?.(e.pointerId); };
    const mu = (e: PointerEvent) => { this.dragging = false; el.releasePointerCapture?.(e.pointerId); };
    const mm = (e: PointerEvent) => { if (this.dragging && this.enabled) { this.dragX += e.movementX * 0.006; this.dragY += e.movementY * 0.004; } };
    const wh = (e: WheelEvent) => { if (!this.enabled) return; e.preventDefault(); this.wheel += Math.sign(e.deltaY); };
    el.addEventListener('pointerdown', md); el.addEventListener('pointerup', mu); el.addEventListener('pointermove', mm); el.addEventListener('wheel', wh, { passive: false });
    this.cleanup.push(() => { el.removeEventListener('pointerdown', md); el.removeEventListener('pointerup', mu); el.removeEventListener('pointermove', mm); el.removeEventListener('wheel', wh); });
  }

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
