import type { t } from './common.ts';

/**
 * Playback state machine (pure).
 */
export type PlaybackStateLib = {
  readonly Util: t.PlaybackStateUtilLib;

  /** Create initial playback state and side-effect intents from optional inputs. */
  init(args?: PlaybackInitArgs): t.PlaybackSnapshot;

  /** Advance playback state by reducing an action or signal into next state and effects. */
  reduce(prev: t.PlaybackState, input: t.PlaybackInput): t.PlaybackSnapshot;
};

/** Arguments for the `Playback.init` method. */
export type PlaybackInitArgs = { timeline?: t.PlaybackTimeline; startBeat?: t.PlaybackBeatIndex };

/**
 * Utility helpers:
 */
export type PlaybackStateUtilLib = {
  /** Pure builder: experience timeline (algebra) → ui-state timeline. */
  buildTimeline<P = unknown>(
    experience: t.Timecode.Experience.Timeline<P>,
  ): t.TimecodeState.Playback.Timeline;

  /** Derive active phase (media vs pause) for a beat at vTime. */
  activePhase(
    timeline: t.PlaybackTimeline,
    beat: t.PlaybackBeatIndex,
    vTime: t.Msecs,
  ): 'media' | 'pause' | undefined;
};
