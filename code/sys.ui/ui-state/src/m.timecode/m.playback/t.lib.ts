import type { t } from './common.ts';

/**
 * Playback state machine (pure).
 */
export type PlaybackStateLib = {
  /** Create initial playback state and side-effect intents from optional inputs. */
  init(args?: PlaybackInitArgs): t.PlaybackSnapshot;

  /** Advance playback state by reducing an action or signal into next state and effects. */
  reduce(prev: t.PlaybackState, input: t.PlaybackInput): t.PlaybackSnapshot;
};

/** Arguments for the `Playback.init` method. */
export type PlaybackInitArgs = {
  timeline?: t.PlaybackTimeline;
  startBeat?: t.PlaybackBeatIndex;
};
