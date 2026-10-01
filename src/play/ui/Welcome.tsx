/** First arrival in the world: what you can do, how it works, and the promises of the game. Shown once; the menu repeats the controls. */
export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div class="play-terminal" role="dialog" aria-label="Welcome to Bytehaven" data-testid="play-welcome" style={{ background: 'rgba(6,8,20,.94)' }}>
      <div class="term-body" style={{ maxWidth: '760px' }}>
        <h1>Welcome to Bytehaven</h1>
        <p>Four worlds and a mountain. Walk around, talk to people, and change things with code you write yourself.</p>
        <section class="panel">
          <h3>Move and act</h3>
          <p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or the arrow keys to walk · <kbd>Shift</kbd> to run · <kbd>Space</kbd> to jump · <kbd>E</kbd> to talk, inspect, use or enter · move the mouse to look around (or <kbd>Q</kbd>/<kbd>R</kbd>) · <kbd>M</kbd> map · <kbd>H</kbd> Field Manual · <kbd>Esc</kbd> menu.</p>
        </section>
        <section class="panel">
          <h3>How this world works</h3>
          <ul>
            <li><strong>Your code changes the world.</strong> Terminals open real lessons with a real editor. A program that works moves something you can see; one that does not makes something go wrong. Nothing is ever lost.</li>
            <li><strong>XP and levels are not skill.</strong> What you can actually do is recorded from your work, and the Skills view shows it.</li>
            <li><strong>If a hard task goes wrong</strong> you lose some Focus and train in the Simulation Room before trying again: a different problem, never the same one. There is no shortcut and no punishment beyond that.</li>
            <li><strong>A glowing diamond</strong> marks a person with work for you, or the next place the story leads. It never tells you how to solve anything.</li>
          </ul>
        </section>
        <button class="btn gold" onClick={onStart} data-testid="welcome-start" autoFocus>Let’s go</button>
      </div>
    </div>
  );
}
