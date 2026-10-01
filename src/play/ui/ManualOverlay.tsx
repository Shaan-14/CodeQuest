import { FieldManual } from '../../app/components/FieldManual';

/** The Field Manual in the world: the same searchable documentation (every example runs), always one key (H) away. */
export function ManualOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div class="play-terminal" role="dialog" aria-label="Field Manual" data-testid="play-manual">
      <div class="term-head"><h2>📖 Field Manual</h2><button class="btn small gold" onClick={onClose} data-testid="manual-close">Close</button></div>
      <div class="term-body"><FieldManual /></div>
    </div>
  );
}
