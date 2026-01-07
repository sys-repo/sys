import type * as H from './t.hooks.ts';
import type * as R from './t.runtime.ts';
import type * as W from './t.wire.ts';

type U = unknown;

/**
 * Playback Driver: connects the playback state machine to real video playback.
 */
export type TimecodePlaybackDriverLib = {
  /** Runtime bridge between reducer cmds/signals and the video decks. */
  create(args: R.CreatePlaybackDriverArgs): R.PlaybackDriver;

  /** UI control surface that emits playback actions. */
  controller(dispatch: R.TimelineControllerDispatch): R.TimelineController;

  /** React integration hook (owns reducer + driver lifecycle). */
  useDriver(args: H.UsePlaybackDriverArgs): H.UsePlaybackDriverResult;

  /** Pure projection hook from playback spec to timeline representations. */
  usePlaybackTimeline<P = U>(args: H.UsePlaybackTimelineArgs<P>): H.UsePlaybackTimelineResult<P>;

  /**
   * Resolve runtime media identity for a playback beat.
   *
   * Given a bundled playback spec and resolver, returns a function that maps
   * a beat index → concrete media URL (+ optional slice), or <undefined> when
   * the media is unavailable.
   *
   * This is the sole boundary where authoring-time media refs are translated
   * into runtime playback media.
   */
  resolveBeatMedia(bundle: W.SpecTimelineBundle): R.ResolveBeatMedia;
};
