import type { WorldEffect } from '../schema';

/**
 * WHAT CODE DOES IN THE PLAYABLE WORLD. Finishing a lesson's final challenge causes these effects (same contract as content/worldEffects.ts:
 * `target` is `area.object`, `action` one verb). The derived world state remembers them forever, so the robot stays repaired after a reload.
 * Scenes decide how each looks (their `reactions`); the learning engine never knows.
 */
export const PLAY_EFFECTS: Record<string, WorldEffect[]> = {
  // Maintenance Bay: Bolt-7 is repaired a module at a time.
  'py-01-first-program': [{ target: 'bay.bolt', action: 'eyes' }],
  'py-02-fixing-errors': [{ target: 'bay.bolt', action: 'arm' }],
  'py-03-variables': [{ target: 'bay.bolt', action: 'power' }],
  'py-04-strings': [{ target: 'bay.bolt', action: 'voice' }],
  'py-05-numbers': [{ target: 'bay.bolt', action: 'servo' }],
  'py-06-input-conversion': [{ target: 'bay.bolt', action: 'ears' }],
  'py-07-logic': [{ target: 'bay.bolt', action: 'decide' }],
  'py-08-if-else': [{ target: 'bay.bolt', action: 'senses' }],
  'py-10-while': [{ target: 'bay.bolt', action: 'cycle' }],
  'py-11-for-range': [{ target: 'bay.bolt', action: 'loop' }],
  'py-12-functions': [{ target: 'bay.bolt', action: 'routine' }],
  'py-13-wake-robot': [{ target: 'bay.bolt', action: 'awake' }],
  // Manufacturing Floor: the line comes back to life.
  'py-14-independent-trial': [{ target: 'floor.gate', action: 'open' }],
  'py-15-lists': [{ target: 'floor.belt', action: 'run' }],
  'py-16-dicts': [{ target: 'floor.arm', action: 'run' }],
  'py-17-records': [{ target: 'floor.scanner', action: 'online' }],
  'py-18-function-design': [{ target: 'floor.arm', action: 'precise' }],
  'py-19-debugging': [{ target: 'floor.belt', action: 'repair' }],
  'py-20-files': [{ target: 'floor.logs', action: 'open' }],
  'py-21-cleaning': [{ target: 'floor.dashboard', action: 'light' }],
  // Lanternhollow Academy: runes (HTML) raise the hall, wards (CSS) protect it, incantations (JavaScript) answer the Gloomhound.
  'web-01-html-basics': [{ target: 'hall.banner', action: 'unfurl' }],
  'web-02-links-lists': [{ target: 'hall.portal', action: 'frame' }],
  'web-05-forms': [{ target: 'hall.portal', action: 'open' }],
  'web-07-independent-html': [{ target: 'hall.crest', action: 'shine' }],
  'web-08-css-selectors': [{ target: 'ward.dome', action: 'color' }],
  'web-09-box-model': [{ target: 'ward.dome', action: 'thick' }],
  'web-10-flexbox': [{ target: 'ward.runes', action: 'align' }],
  'web-11-grid': [{ target: 'ward.runes', action: 'grid' }],
  'web-12-responsive': [{ target: 'ward.dome', action: 'adapt' }],
  'web-14-independent-css': [{ target: 'ward.dome', action: 'aegis' }],
  'web-15-js-basics': [{ target: 'arena.orb', action: 'spark' }],
  'web-16-js-data': [{ target: 'arena.hound', action: 'hit1' }],
  'web-18-dom': [{ target: 'arena.lanterns', action: 'light' }],
  'web-19-events': [{ target: 'arena.hound', action: 'hit2' }],
  'web-20-forms-js': [{ target: 'arena.hound', action: 'hit3' }],
  'web-22-async': [{ target: 'arena.hound', action: 'hit4' }],
  'web-23-fetch': [{ target: 'arena.oracle', action: 'answer' }],
  'web-26-independent-js': [{ target: 'arena.hound', action: 'defeat' }],
};
