/**
 * THE SEQUENCER: plays a list of story segments (content/play/opening.ts): for each, show a place (as it was, or as it is) and play its cue sheet.
 * It owns nothing about the game: no save is touched while it runs (the screen decides what to write when it ends or is skipped), so skipping can
 * never corrupt progress.
 *
 * Smoothness is its job. The next place is BUILT while the current shot plays (`Stage.prepare`: a few milliseconds per frame, shaders compiled in
 * parallel, geometry and textures drawn once into a tiny off-screen target), so a cut is a swap that costs almost nothing; the picture dissolves
 * through black across the end of one sheet and the start of the next (the fade-out overlaps the last moments of a shot, the fade-in the first of
 * the next), so black is a deliberate beat and never a stall; and between the sheets of one place the camera simply keeps going from where it was.
 */
import type { Segment } from '../../content/play/opening';
import type { SceneDef } from '../../play/logic/sceneTypes';
import type { Stage } from '../engine/stage';

export interface SeqHost {
  stage(): Stage | null;
  scene(id: string): SceneDef | undefined;
  /** Put the place on the stage without touching the save (a swap when it was prepared). */
  load(scene: string, spawn: Segment['spawn'], opts: { power: number | null; pristine: boolean }): void;
  /** Dissolve to black or back over `ms` (returns at once; the picture keeps moving). */
  fade(to: 'black' | 'clear', ms: number): void;
  skipped(): boolean;
  /** Show the credits over the world; resolves when they end (or are skipped). */
  credits?(): Promise<void>;
}

export type SeqResult = 'done' | 'skipped';
/** The dissolve out starts this long before a sheet ends and the dissolve in lasts this long: black is a beat of about a second, deliberately. */
export const FADE_OUT_MS = 420, FADE_IN_MS = 720;

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

export async function playSegments(host: SeqHost, segs: readonly Segment[], o: { /** The first segment's place is already on the stage (a new game builds it while the title is black). */ startLoaded?: boolean } = {}): Promise<SeqResult> {
  const stage0 = host.stage(); if (!stage0) return 'skipped';
  stage0.director.hold(true);
  const nextPlace = (from: number): Segment | undefined => { for (let j = from; j < segs.length; j++) if (!segs[j]!.keep) return segs[j]; return undefined; };
  try {
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i]!, stage = host.stage(); if (!stage) return 'skipped';
      if (host.skipped()) return 'skipped';
      const cut = !seg.keep, loaded = i === 0 && !!o.startLoaded;
      if (cut && !loaded) {
        // the place was prepared during the previous shot; if it was not (a slow machine), the picture is already dissolving: wait for it behind black
        const def = host.scene(seg.scene);
        if (def && !stage.isPrepared(seg.scene)) { host.fade('black', FADE_OUT_MS); stage.prepare(def, !!seg.pristine); await Promise.race([stage.whenPrepared(), sleep(2500)]); }
        if (host.skipped()) return 'skipped';
        host.load(seg.scene, seg.spawn, { power: seg.dark ? 0 : seg.power === undefined ? null : seg.power, pristine: !!seg.pristine });
        if (seg.dark) stage.setPowerOverride(0, 0, 0); // stopped as well as dark: the sheet brings it back
        stage.setPlayerVisible(!!seg.player);
        stage.setControlLocked(true);
      }
      if (loaded) { stage.setPlayerVisible(!!seg.player); stage.setControlLocked(true); }
      const upcoming = nextPlace(i + 1); // build the next place now, in the gaps between frames
      if (upcoming) { const d = host.scene(upcoming.scene); if (d) stage.prepare(d, !!upcoming.pristine); }
      if (!stage.playCinematic(seg.sheet)) continue;
      if (cut) host.fade('clear', seg.fadeIn ?? FADE_IN_MS); // the shot is already in place: the picture comes up on it
      const credits = seg.credits && host.credits ? host.credits() : Promise.resolve();
      let ended = false;
      const idle = stage.director.whenIdle().then(() => { ended = true; });
      if (upcoming) { // dissolve out across the last moments of the sheet when a new place follows
        while (!ended && !host.skipped() && stage.director.remaining() > FADE_OUT_MS / 1000) await Promise.race([idle, sleep(40)]);
        if (!ended && !host.skipped()) host.fade('black', FADE_OUT_MS);
      }
      await idle;
      await credits;
      if (host.skipped()) return 'skipped';
    }
    return 'done';
  } finally {
    host.stage()?.cancelPrepare();
    host.stage()?.director.hold(false);
  }
}
