/** First arrival: the controls and the promises of the game, on one card. Shown once; the pause menu repeats the controls. */
export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div class="welcome" role="dialog" aria-label="Welcome to Bytehaven" data-testid="play-welcome">
      <div class="welcome-card">
        <div class="welcome-kicker">CodeQuest</div>
        <h1>Welcome to Bytehaven</h1>
        <p class="welcome-sub">Four worlds and a mountain. Walk, talk, and change the world with code you write yourself.</p>
        <div class="welcome-keys" aria-label="Controls">
          <div><span class="kbds"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span>move<small>arrows work too · <kbd>Shift</kbd> run · <kbd>Space</kbd> jump</small></div>
          <div><span class="kbds"><kbd>🖱</kbd></span>look around<small>just move the mouse · <kbd>Esc</kbd> to release it</small></div>
          <div><span class="kbds"><kbd>E</kbd></span>talk · inspect · use<small><kbd>M</kbd> map · <kbd>H</kbd> Field Manual</small></div>
        </div>
        <ul class="welcome-promises">
          <li><strong>Your code changes the world.</strong> Terminals open real lessons with a real editor. A program that works moves something you can see.</li>
          <li><strong>XP and levels are not skill.</strong> What you can really do is recorded from your work, in the Skills view.</li>
          <li><strong>If a hard task goes wrong</strong> you train in the Simulation Room and try a <em>different</em> problem. No shortcuts, no punishment.</li>
          <li>A <strong>glowing trail</strong> and a light column show where the story goes next. They never say how to solve anything.</li>
        </ul>
        <button class="btn gold welcome-go" onClick={onStart} data-testid="welcome-start" autoFocus>Begin</button>
      </div>
    </div>
  );
}
