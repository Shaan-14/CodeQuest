import { useEffect, useState } from 'preact/hooks';
import type { CineState } from '../engine/director';

type Sub = NonNullable<CineState['subtitle']>;
/** The line on screen, kept for a moment after it ends so it fades out instead of vanishing. */
function useLingering(sub: Sub | null | undefined, on: boolean): { sub: Sub | null; out: boolean } {
  const live = on && sub ? sub : null;
  const [last, setLast] = useState<Sub | null>(null);
  useEffect(() => {
    if (live) { setLast(live); return; }
    const t = window.setTimeout(() => setLast(null), 420);
    return () => window.clearTimeout(t);
  }, [live?.text, live?.who, !!live]);
  return live ? { sub: live, out: false } : { sub: last, out: true };
}

/** What the player sees during a cinematic: letterbox bars, the line being spoken, a quest-complete / level-up banner and the skip hint. */
export function CinematicOverlay({ cine, hold = false }: { cine: CineState; hold?: boolean }) {
  const { sub, out } = useLingering(cine.subtitle, cine.active || hold);
  return (
    <div class={`cine ${cine.active || hold ? 'on' : ''}`} aria-live="polite" data-testid="cine" data-active={cine.active ? '1' : '0'}>
      <div class="cine-bar top" aria-hidden="true" /><div class="cine-bar bottom" aria-hidden="true" />
      {sub && (
        <div class={`cine-sub ${out ? 'out' : ''}`} data-testid="cine-subtitle">{sub.who && <b>{sub.who}</b>}<span>{sub.text}</span></div>
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
