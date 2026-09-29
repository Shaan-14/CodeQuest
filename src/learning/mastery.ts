/**
 * Mastery model (types only for now; implemented in a later phase).
 *
 * Core rule: XP/levels/quests are engagement and pacing. They are NEVER evidence of mastery.
 * Mastery is derived only from EvidenceRecords of demonstrated performance, weighted by how
 * independent the performance was.
 */

/** How much help the player had. Higher independence = stronger evidence. */
export type SupportLevel =
  | 'worked-example' // player read/followed a full solution
  | 'guided' // step-by-step scaffolding, hints available
  | 'hinted' // blank problem, player used hints
  | 'independent' // no hints, no solution shown
  | 'transfer'; // independent, in an unfamiliar context/technology

export interface EvidenceRecord {
  skillId: string;
  challengeId: string;
  /** ISO timestamp. */
  at: string;
  passed: boolean;
  support: SupportLevel;
  /** True if verified by actually executing the player's code against tests. */
  executed: boolean;
}
