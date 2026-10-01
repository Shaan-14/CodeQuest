/**
 * WHICH VIEW IS SHOWN. The 3D world is the game: every launch, new or returning, enters it. The classic screens remain underneath (lessons,
 * the Field Manual and the skills view are the same components the world opens), and the whole classic UI is still reachable as a developer /
 * debugging aid with `?classic` in the address. It is deliberately not a player-facing option: no button, menu or stored preference selects it.
 */
export type UiMode = '3d' | 'classic';

export function uiMode(): UiMode {
  try { return new URLSearchParams(window.location.search).has('classic') ? 'classic' : '3d'; } catch { return '3d'; }
}
