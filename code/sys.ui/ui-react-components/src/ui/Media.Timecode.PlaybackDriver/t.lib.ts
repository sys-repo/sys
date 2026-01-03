import type { t } from './common.ts';
import type * as H from './t.hooks.ts';
import type * as R from './t.runtime.ts';
import type * as B from './t.build.ts';

type U = unknown;
type Timeline = t.TimecodeState.Playback.Timeline;

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

  /** Pure builder: experience timeline + wire bundle → ui-state timeline. */
  buildPlaybackTimeline<P = U>(args: B.BuildPlaybackTimelineArgs<P>): Timeline;
};
