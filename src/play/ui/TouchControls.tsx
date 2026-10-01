import type { Input } from '../engine/input';

const pad = (input: Input, key: string) => ({
  onPointerDown: (e: PointerEvent) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); input.hold(key, true); },
  onPointerUp: () => input.hold(key, false), onPointerCancel: () => input.hold(key, false), onPointerLeave: () => input.hold(key, false),
});

/** On-screen controls for touch screens (tablets): a direction pad and the three action buttons. Same inputs as the keyboard; shown only on touch devices. */
export function TouchControls({ input }: { input: Input }) {
  const btn = (k: string, label: string, aria: string) => <button class="touch-btn" aria-label={aria} {...pad(input, k)}>{label}</button>;
  return (
    <div class="touch-controls" data-testid="touch-controls">
      <div class="touch-pad">{btn('w', '▲', 'Walk forward')}<div>{btn('a', '◀', 'Walk left')}{btn('s', '▼', 'Walk back')}{btn('d', '▶', 'Walk right')}</div></div>
      <div class="touch-actions">
        <button class="touch-btn big" aria-label="Interact" onPointerDown={(e) => { e.preventDefault(); input.press('e'); }}>E</button>
        {btn('Shift', '⏩', 'Run')}{btn(' ', '⤒', 'Jump')}
      </div>
    </div>
  );
}
