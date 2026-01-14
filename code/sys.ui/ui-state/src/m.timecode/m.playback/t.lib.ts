import type { t } from './common.ts';

/**
 * Playback state machine (pure).
 */
export type PlaybackStateLib = {
  readonly Is: t.PlaybackStateIsLib;
  readonly Util: t.PlaybackStateUtilLib;

  /** Create initial playback state and side-effect intents from optional inputs. */
  init(args?: PlaybackInitArgs): t.PlaybackSnapshot;

  /** Advance playback state by reducing an action or signal into next state and effects. */
  reduce(prev: t.PlaybackState, input: t.PlaybackInput): t.PlaybackSnapshot;
};

/** Arguments for the `Playback.init` method. */
export type PlaybackInitArgs = { timeline?: t.PlaybackTimeline; startBeat?: t.PlaybackBeatIndex };

/**
 * Utility Helpers
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

  /** Resolve the beat index that owns vTime (media + pause span). */
  beatIndexAtVTime(timeline: t.PlaybackTimeline, vTime: t.Msecs): t.PlaybackBeatIndex;
};

/**
 * Type guards.
 */
export type PlaybackStateIsLib = {
  /** Policy: treat playback as terminal (no further auto-advance) when there is no next segment. */
  terminalEnd(state: t.PlaybackState): boolean;
};
