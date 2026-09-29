import { useState } from 'preact/hooks';
import { avatars } from '../../content/avatars';
import { createPlayer } from '../../game/actions';
import { getStore } from '../../game/store';
import { Avatar } from '../components/Avatar';

export function Title({ onStart }: { onStart: () => void }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(avatars[0]!.id);
  const begin = (e: Event) => {
    e.preventDefault();
    const s = getStore();
    s.apply(createPlayer(s.save, name, avatar));
    onStart();
  };
  return (
    <main class="title-screen">
      <div class="title-stars" aria-hidden="true" />
      <div class="title-card">
        <h1 class="logo">CodeQuest</h1>
        <p class="tagline">Learn to solve real technical problems, by doing.</p>
        <form onSubmit={begin}>
          <label class="field">
            <span>Your name</span>
            <input type="text" value={name} maxLength={20} placeholder="Adventurer" onInput={(e) => setName((e.target as HTMLInputElement).value)} data-testid="name-input" autofocus />
          </label>
          <div class="field">
            <span>Choose your character</span>
            <div class="avatar-picker" role="radiogroup">
              {avatars.map((a) => (
                <button type="button" key={a.id} role="radio" aria-checked={avatar === a.id} class={`avatar-option ${avatar === a.id ? 'selected' : ''}`} onClick={() => setAvatar(a.id)} data-testid={`avatar-${a.id}`}>
                  <Avatar avatar={a.id} size={72} />
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button type="submit" class="btn primary big" data-testid="begin">Begin your quest</button>
        </form>
        <p class="muted small">Progress is saved in this browser. No account needed.</p>
      </div>
    </main>
  );
}
