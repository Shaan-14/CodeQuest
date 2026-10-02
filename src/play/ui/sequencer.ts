/**
 * THE SEQUENCER: plays a list of story segments (content/play/opening.ts): for each, cut to a place (a quick dip to black), show it as it was or as it is,
 * and play its cue sheet. It owns nothing about the game: no save is touched while it runs (the screen decides what to write when it ends or is skipped),
 * so skipping can never corrupt progress. Everything that decides what a segment looks like is data.
 */
import type { Segment } from '../../content/play/opening';
import type { Stage } from '../engine/stage';

export interface SeqHost {
  stage(): Stage | null;
  /** Put the world's scene on the stage without touching the save. */
  load(scene: string, spawn: Segment['spawn'], opts: { power: number | null; pristine: boolean }): void;
  /** Dip to black (true) or come back (false); resolves when it has happened. */
  curtain(on: boolean): Promise<void>;
  skipped(): boolean;
  /** Show the credits over the world; resolves when they end (or are skipped). */
  credits?(): Promise<void>;
}

export type SeqResult = 'done' | 'skipped';

export async function playSegments(host: SeqHost, segs: readonly Segment[]): Promise<SeqResult> {
  for (const seg of segs) {
    const stage = host.stage(); if (!stage) return 'skipped';
    if (host.skipped()) return 'skipped';
    if (!seg.keep) {
      await host.curtain(true);
      if (host.skipped()) return 'skipped';
      host.load(seg.scene, seg.spawn, { power: seg.dark ? 0 : seg.power === undefined ? null : seg.power, pristine: !!seg.pristine });
      if (seg.dark) stage.setPowerOverride(0, 0, 0); // stopped as well as dark: the sheet brings it back
      stage.setPlayerVisible(!!seg.player);
      stage.setControlLocked(true);
    }
    if (!stage.playCinematic(seg.sheet)) continue;
    if (!seg.keep) await host.curtain(false);
    const credits = seg.credits && host.credits ? host.credits() : Promise.resolve();
    await Promise.all([stage.director.whenIdle(), credits]);
    if (host.skipped()) return 'skipped';
  }
  return 'done';
}
