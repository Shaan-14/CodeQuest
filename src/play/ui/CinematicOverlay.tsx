import type { CineState } from '../engine/director';

/** What the player sees during a cinematic: letterbox bars, the line being spoken, a quest-complete / level-up banner and the skip hint. */
export function CinematicOverlay({ cine, hold = false }: { cine: CineState; hold?: boolean }) {
  return (
    <div class={`cine ${cine.active || hold ? 'on' : ''}`} aria-live="polite" data-testid="cine" data-active={cine.active ? '1' : '0'}>
      <div class="cine-bar top" aria-hidden="true" /><div class="cine-bar bottom" aria-hidden="true" />
      {(cine.active || hold) && cine.subtitle && (
        <div class="cine-sub" data-testid="cine-subtitle">{cine.subtitle.who && <b>{cine.subtitle.who}</b>}<span>{cine.subtitle.text}</span></div>
      )}
      {cine.banner && (
        <div class={`cine-banner ${cine.banner.kind}`} role="status" data-testid="cine-banner">
          <div class="cine-banner-kicker">{cine.banner.kind === 'quest' ? 'Quest complete' : cine.banner.kind === 'level' ? 'Level up' : cine.banner.kind === 'unlock' ? 'Unlocked' : ''}</div>
          <div class="cine-banner-title">{cine.banner.title}</div>
          {cine.banner.sub && <div class="cine-banner-sub">{cine.banner.sub}</div>}
        </div>
      )}
      {cine.active && cine.canSkip && !hold && <div class="cine-skip" aria-hidden="true"><kbd>Space</kbd> skip</div>}
    </div>
  );
}
