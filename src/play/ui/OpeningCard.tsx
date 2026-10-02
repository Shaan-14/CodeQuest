import { OPENING_LINES } from '../../content/play/openingText';

/** The opening for players who asked for reduced motion: the same story as plain text, no camera work. */
export function OpeningCard({ onContinue }: { onContinue: () => void }) {
  return (
    <div class="welcome" role="dialog" aria-label="The story so far" data-testid="opening-card">
      <div class="welcome-card">
        <div class="welcome-kicker">CodeQuest</div>
        <h1>Bytehaven</h1>
        {OPENING_LINES.map((l) => <p key={l.text} class="welcome-sub"><b>{l.who}</b> {l.text}</p>)}
        <button class="btn gold welcome-go" onClick={onContinue} data-testid="opening-card-go" autoFocus>Step into the plaza</button>
      </div>
    </div>
  );
}
