import { type t } from './common.ts';

/** Construction args for building a `Playback.Timeline`. */
export type BuildPlaybackTimelineArgs<P = unknown> = {
  timeline: t.Timecode.Experience.Timeline<P>;
  bundle: t.TimecodePlaybackDriver.Wire.Bundle<P>;
};
