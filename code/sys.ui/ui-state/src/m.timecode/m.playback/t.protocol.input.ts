import type { t } from './common.ts';

/**
 * Playback inputs.
 *
 * Inputs are the only way the playback state machine advances.
 * They represent either:
 *
 *  - User or system intentions (PlaybackAction)
 *  - Runtime signals emitted by the runner/adapters (PlaybackSignal)
 *
 * Inputs are pure data. They never cause effects directly;
 * they are reduced into state, commands, and events by the machine.
 */
export type PlaybackInput = PlaybackAction | PlaybackSignal;

/**
 * Intentional inputs originating from UI or higher-level controllers.
 */
export type PlaybackAction =
  | {
      readonly kind: 'playback:init';
      readonly timeline: t.PlaybackTimeline;
      readonly startBeat?: t.PlaybackBeatIndex;
    }
  | { readonly kind: 'playback:play' }
  | { readonly kind: 'playback:pause' }
  | { readonly kind: 'playback:stop' }
  | { readonly kind: 'playback:seek:beat'; readonly beat: t.PlaybackBeatIndex }
  | { readonly kind: 'playback:next' }
  | { readonly kind: 'playback:prev' };

/**
 * Observational inputs emitted by the runner to reflect runtime reality
 * (media readiness, buffering, time progression, errors).
 */
export type PlaybackSignal =
  | { readonly kind: 'video:ended'; readonly deck: t.PlaybackDeckId }
  /**
   * Runner-provided virtual timeline time (not source/video time).
   * The runner is responsible for mapping player time → vTime.
   */
  | { readonly kind: 'video:time'; readonly deck: t.PlaybackDeckId; readonly vTime: t.Msecs }
  | { readonly kind: 'video:ready'; readonly deck: t.PlaybackDeckId }

  /**
   * Runtime buffering state for a deck (mid-play stall).
   * The runner should emit this when the player enters/leaves buffering.
   */
  | { readonly kind: 'video:buffering'; readonly deck: t.PlaybackDeckId; readonly is: boolean }
  | { readonly kind: 'runner:ready' }
  | { readonly kind: 'runner:error'; readonly message: string };
