/**
 * THE OPENING AND THE ENDING as data: a list of segments, each a place, how it looks (as it was when everything worked, or as the player's work has
 * left it) and the cue sheet that plays there. The sequencer (play/ui/sequencer.ts) plays them in order; nothing here touches the save.
 */
export interface Segment {
  id: string;
  scene: string;
  /** A spawn name of the scene, or an explicit place. The player is only shown when `player` is true. */
  spawn?: string | { x: number; z: number; ry: number };
  /** The glow of the whole place for the segment (1 = alive, 0 = offline); undefined = what the player has restored. */
  power?: number | null;
  /** Load the place as it was when everything worked (every earnable change applied). */
  pristine?: boolean;
  player?: boolean;
  /** The cue sheet (a key of CINEMATICS). */
  sheet: string;
  /** Carry on in the place already on the stage (no cut). */
  keep?: boolean;
  /** Load the place stopped and unpowered, for a sheet that brings it back. */
  dark?: boolean;
  /** The credits roll over this segment (the sequence waits for them as well as for the sheet). */
  credits?: boolean;
}

/** Where a new game (and every reset) begins: always the plaza, here, whatever the player stood in before. */
export const START = { scene: 'plaza', spawn: 'start' } as const;

/** About 85 seconds: the city at its best, the failure world by world, a newcomer's arrival, Juno, the four worlds, and the controls handed over. */
export const OPENING: Segment[] = [
  { id: 'plaza-bright', scene: 'plaza', spawn: 'start', power: 1, pristine: true, sheet: 'opening:plaza-bright' },
  { id: 'robotics-bright', scene: 'manufacturing-floor', power: 1, pristine: true, sheet: 'opening:robotics-bright' },
  { id: 'ballpark-bright', scene: 'ballpark', power: 1, pristine: true, sheet: 'opening:ballpark-bright' },
  { id: 'web-bright', scene: 'spell-classroom', power: 1, pristine: true, sheet: 'opening:web-bright' },
  { id: 'racing-bright', scene: 'track', spawn: 'paddock', power: 1, pristine: true, sheet: 'opening:racing-bright' },
  { id: 'robotics-fail', scene: 'manufacturing-floor', power: 1, pristine: true, sheet: 'opening:robotics-fail' },
  { id: 'ballpark-fail', scene: 'ballpark', power: 1, pristine: true, sheet: 'opening:ballpark-fail' },
  { id: 'web-fail', scene: 'spell-classroom', power: 1, pristine: true, sheet: 'opening:web-fail' },
  { id: 'racing-fail', scene: 'garage', power: 1, pristine: true, sheet: 'opening:racing-fail' },
  { id: 'plaza-fail', scene: 'plaza', spawn: 'start', power: 1, pristine: true, sheet: 'opening:plaza-fail' },
  // the real world, as it is: dark, and waiting
  { id: 'arrive', scene: 'plaza', spawn: 'start', player: true, sheet: 'opening:arrive' },
  { id: 'juno', scene: 'plaza', keep: true, player: true, sheet: 'opening:juno' },
  { id: 'worlds', scene: 'plaza', keep: true, player: true, sheet: 'opening:worlds' },
];

/**
 * THE ENDING (after the Summit's final trial is passed and the great beacon has lit): the summit holds its breath, then each world wakes from the
 * dark in the order it failed, the plaza lights its core and its four lanes, the credits roll over it, and a last scene among its people closes
 * the story. `dark` loads a place stopped and unpowered so the sheet can bring it back.
 */
export const ENDING: Segment[] = [
  { id: 'summit', scene: 'summit', keep: true, player: true, sheet: 'ending:summit' },
  { id: 'robotics', scene: 'manufacturing-floor', pristine: true, dark: true, sheet: 'ending:robotics' },
  { id: 'ballpark', scene: 'ballpark', pristine: true, dark: true, sheet: 'ending:ballpark' },
  { id: 'web', scene: 'spell-classroom', pristine: true, dark: true, sheet: 'ending:web' },
  { id: 'racing', scene: 'garage', pristine: true, dark: true, sheet: 'ending:racing' },
  { id: 'plaza', scene: 'plaza', spawn: 'from-summit', dark: true, player: true, sheet: 'ending:plaza' },
  { id: 'credits', scene: 'plaza', keep: true, player: true, credits: true, sheet: 'ending:credits' },
  { id: 'after', scene: 'plaza', keep: true, player: true, sheet: 'ending:after' },
];
