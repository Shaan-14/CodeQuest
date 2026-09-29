import { useState } from 'preact/hooks';
import { NotesList } from '../components/NotesList';
import { SkillsView } from '../components/SkillsView';

export function Library() {
  const [tab, setTab] = useState<'notes' | 'log'>('notes');
  return (
    <main class="scene theme-library" data-testid="library">
      <div class="scene-card wide">
        <h1 class="scene-title">📚 Great Library</h1>
        <div class="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'notes'} class={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}>Notebook</button>
          <button role="tab" aria-selected={tab === 'log'} class={tab === 'log' ? 'active' : ''} onClick={() => setTab('log')} data-testid="tab-log">Training Log</button>
        </div>
        {tab === 'notes' ? <NotesList /> : <SkillsView />}
      </div>
    </main>
  );
}
