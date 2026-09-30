/**
 * WHICH VIEW THE PLAYER USES. The same game, two presentations: the 3D world and the classic screens. It is a device preference (not part
 * of the save, so a save imported on another computer does not force a view that computer cannot run). `?classic` in the address forces classic.
 */
export type UiMode = '3d' | 'classic';
const KEY = 'codequest.mode';

export function uiMode(): UiMode {
  try {
    if (new URLSearchParams(window.location.search).has('classic')) return 'classic';
    return window.localStorage.getItem(KEY) === 'classic' ? 'classic' : '3d';
  } catch { return '3d'; }
}
export function setUiMode(m: UiMode): void { try { window.localStorage.setItem(KEY, m); } catch { /* private window: the choice lasts for this session only */ } }
