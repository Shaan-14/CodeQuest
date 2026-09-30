/** Things that happened as a result of an action; the UI turns these into toasts/animations. Not saved. */
export type GameEvent =
  | { type: 'xp'; amount: number; note?: string }
  | { type: 'coins'; amount: number }
  | { type: 'levelUp'; level: number }
  | { type: 'achievement'; id: string }
  | { type: 'areaUnlocked'; id: string }
  | { type: 'questAccepted'; id: string }
  | { type: 'questComplete'; id: string }
  | { type: 'lessonComplete'; id: string }
  | { type: 'item'; id: string }
  | { type: 'focusLost'; amount: number }
  | { type: 'focusGained'; amount: number }
  | { type: 'dailyPassed' }
  | { type: 'dailyFailed' }
  | { type: 'weaknessFound'; id: string }
  | { type: 'weaknessDeepened'; id: string }
  | { type: 'weaknessResolved'; id: string }
  | { type: 'trainingStarted'; planId: string }
  | { type: 'trainingStep'; planId: string }
  | { type: 'trainingComplete'; planId: string }
  | { type: 'bossPassed'; id: string }
  | { type: 'bossFailed'; id: string }
  | { type: 'campaignComplete' }
  /** Phase 6 boundary: something in the game WORLD should react (a door opens, a robot wakes). Emitted once, on the first pass of a challenge that declares it. */
  | { type: 'worldEffect'; target: string; action: string; detail?: Record<string, string | number | boolean>; challengeId: string };
