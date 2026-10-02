/** What the player changed in the world, in plain words, for the ending (each is a world effect the player's own code caused). */
export const WORLD_DEEDS: { effect: string; text: string }[] = [
  { effect: 'bay.bolt:awake', text: 'Bolt-7 stands: a control program you wrote' },
  { effect: 'floor.belt:run', text: 'The Manufacturing Floor’s line runs again' },
  { effect: 'arena.hound:defeat', text: 'The Gloomhound is gone: incantations that really work' },
  { effect: 'arena.oracle:answer', text: 'The oracle answers: a page that talks to a server' },
  { effect: 'field.lineup:set', text: 'The Herons play your lineup: chosen from the data' },
  { effect: 'garage.car:tyres', text: 'The car grips where it slid: a setup read from telemetry' },
];
