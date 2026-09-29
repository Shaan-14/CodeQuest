import { useState } from 'preact/hooks';
import { loadSave, writeSave } from '../core/save';

/** Phase 0 shell: proves the toolchain and the save layer work. No game content yet. */
export function App() {
  const [save, setSave] = useState(() => loadSave(window.localStorage));

  const bump = () => {
    const next = { ...save, launches: save.launches + 1 };
    writeSave(window.localStorage, next);
    setSave(next);
  };

  return (
    <main class="shell">
      <h1>CodeQuest</h1>
      <p class="muted">Foundation shell (Phase 0). The game has not been built yet.</p>
      <section class="panel">
        <p>Save layer check: button clicks persisted across reloads = {save.launches}</p>
        <button onClick={bump}>Increment and save</button>
      </section>
    </main>
  );
}
