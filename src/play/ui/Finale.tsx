import { ENDING } from '../../content/campaign';
import { skills } from '../../content';
import { competencyOf } from '../../game/graph';
import { useGame } from '../../game/store';
import { hasEffect } from '../logic/conditions';

const WORLD_DEEDS: { effect: string; text: string }[] = [
  { effect: 'bay.bolt:awake', text: 'Bolt-7 stands: a control program you wrote' },
  { effect: 'arena.hound:defeat', text: 'The Gloomhound is gone: incantations that really work' },
  { effect: 'field.lineup:set', text: 'The Herons play your lineup: chosen from the data' },
  { effect: 'garage.car:tyres', text: 'The car grips where it slid: a setup read from telemetry' },
];

/** The ending. It tells the player what they can DO (from their own evidence), never how many points they earned. */
export function Finale({ onClose }: { onClose: () => void }) {
  const { save } = useGame();
  const shown = skills.filter((s) => competencyOf(save, s.id) === 'demonstrated');
  const deeds = WORLD_DEEDS.filter((d) => hasEffect(save, d.effect));
  return (
    <div class="play-terminal" role="dialog" aria-label="Campaign complete" data-testid="finale" style={{ background: 'rgba(6,8,20,.9)' }}>
      <div class="term-body" style={{ textAlign: 'center', paddingTop: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem,6vw,3.4rem)' }}>🏔️ Campaign complete</h1>
        <h2 data-testid="finale-title">{ENDING.title}</h2>
        <p style={{ maxWidth: '60ch', margin: '0 auto 1rem' }}>{ENDING.body}</p>
        {deeds.length > 0 && <section class="panel" style={{ maxWidth: '60ch', margin: '1rem auto', textAlign: 'left' }}><h3>What you changed in the world</h3><ul>{deeds.map((d) => <li key={d.effect}>{d.text}</li>)}</ul></section>}
        <section class="panel" style={{ maxWidth: '60ch', margin: '1rem auto', textAlign: 'left' }} data-testid="finale-skills">
          <h3>What you have shown you can do</h3>
          {shown.length ? <p class="muted">{shown.length} skills demonstrated independently, on problems of different kinds: {shown.slice(0, 14).map((s) => s.title).join(' · ')}{shown.length > 14 ? ' · …' : ''}</p> : <p class="muted">Your independent work is recorded in the Skills view.</p>}
          <p class="small muted">This list comes from your evidence, not from XP or levels. Levels only measure how far you adventured.</p>
        </section>
        <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button class="btn gold" onClick={onClose} data-testid="finale-continue" autoFocus>Keep exploring</button>
        </div>
      </div>
    </div>
  );
}
