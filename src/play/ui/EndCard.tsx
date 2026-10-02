import { useEffect } from 'preact/hooks';

/** The last image of the story: black, then the name. It holds for a moment and then hands over to the ending card. */
export function EndCard({ onDone, reduced }: { onDone: () => void; reduced: boolean }) {
  useEffect(() => { const t = window.setTimeout(onDone, reduced ? 1500 : 5200); return () => clearTimeout(t); }, [onDone, reduced]);
  return (
    <div class="endcard" role="img" aria-label="CodeQuest" data-testid="endcard" onClick={onDone}>
      <div class="endcard-title">CODEQUEST</div>
    </div>
  );
}
