import type { t } from './common.ts';

import type * as H from './t.hooks.ts';
import type * as R from './t.runtime.ts';
import type * as W from './t.wire.ts';

type U = unknown;

/**
 * Playback Driver: connects the playback state machine to real video playback.
 */
export type TimecodePlaybackDriverLib = {
  readonly Dev: t.TimecodePlaybackDriverDevLib;
  readonly Util: t.TimecodePlaybackDriverUtilLib;

  /** Runtime bridge between reducer cmds/signals and the video decks. */
  readonly create: (args: R.CreatePlaybackDriverArgs) => R.PlaybackDriver;

  /** React integration hook (owns reducer + driver lifecycle). */
  readonly useDriver: (args: H.UsePlaybackDriverArgs) => H.UsePlaybackDriverResult;
};

/**
 * Utility Helpers
 */
export type TimecodePlaybackDriverUtilLib = {
  /** UI control surface that emits playback actions. */
  readonly controller: (dispatch: R.TimelineControllerDispatch) => R.TimelineController;

  /** Pure projection hook from playback spec to timeline representations. */
  readonly usePlaybackTimeline: <P = U>(
    args: H.UsePlaybackTimelineArgs<P>,
  ) => H.UsePlaybackTimelineResult<P>;

  /** Handles generated props/handlers for a controller to bind to PlayerControls. */
  readonly usePlayControlsProps: (args: t.UsePlayControlsPropsArgs) => t.UsePlayControlsPropsResult;

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
  readonly resolveBeatMedia: (bundle: W.SpecTimelineBundle) => R.ResolveBeatMedia;
};
