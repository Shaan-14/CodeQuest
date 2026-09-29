import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ComponentChildren; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div class="modal-backdrop" onClick={onClose}>
      <div class={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div class="modal-head">
          <h2>{title}</h2>
          <button class="btn small ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div class="modal-body">{children}</div>
      </div>
    </div>
  );
}
