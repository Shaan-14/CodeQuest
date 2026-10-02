/**
 * CUTAWAYS: after a world reaction a short sequence can play in ANOTHER place, to show what the work means there: a hitter at the ballpark,
 * a car on the track. The player is taken there under a fade, the sheet plays (it is an ordinary cinematic: content/play/cinematics.ts, skippable),
 * and they are brought back to exactly where they stood. A cutaway only presents: it changes no learning state, and it is only ever played for a
 * SUCCESS (a failed attempt produces no worldEffect, so it never reaches here).
 */
export interface Cutaway { scene: string; spawn?: string; cinematic: string; /** The player stays visible: the sheet uses them (the driver walking to the car). */ player?: boolean }

export const CUTAWAYS: Record<string, Cutaway> = {
  'park-roster': { scene: 'ballpark', cinematic: 'seq-roster' },
  'park-ranking': { scene: 'ballpark', cinematic: 'seq-ranking' },
  'park-clean': { scene: 'ballpark', cinematic: 'seq-clean' },
  'park-lineup': { scene: 'ballpark', cinematic: 'seq-lineup' },
  'park-stats': { scene: 'ballpark', cinematic: 'seq-stats' },
  'park-positions': { scene: 'ballpark', cinematic: 'seq-positions' },
  'track-tyres': { scene: 'track', spawn: 'paddock', cinematic: 'run-tyres', player: true },
  'track-aero': { scene: 'track', spawn: 'paddock', cinematic: 'run-aero', player: true },
  'track-brakes': { scene: 'track', spawn: 'paddock', cinematic: 'run-brakes', player: true },
  'track-fuel': { scene: 'track', spawn: 'paddock', cinematic: 'run-fuel', player: true },
};

export const cutawayFor = (id: string): Cutaway | undefined => CUTAWAYS[id];
