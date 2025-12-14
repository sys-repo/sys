import type { t } from './common.ts';

/**
 * Namespaced public surface for timecode UI state.
 */
export namespace TimecodeState {
  /**
   * Root timecode state library.
   */
  export type Lib = t.TimecodeStateLib;

  /**
   * Playback state machine (pure).
   */
  export namespace Playback {
    export type Lib = t.PlaybackStateLib;

    /** Machine state */
    export type State = t.PlaybackState;

    /** Reducer result */
    export type Update = t.PlaybackUpdate;

    /** All reducer inputs */
    export type Input = t.PlaybackInput;
    export type Action = t.PlaybackAction;
    export type Signal = t.PlaybackSignal;

    /** Reducer outputs */
    export type Cmd = t.PlaybackCmd;
    export type Event = t.PlaybackEvent;

    /** Timeline model */
    export type Timeline = t.PlaybackTimeline;
    export type Beat = t.PlaybackBeat;
    export type BeatIndex = t.PlaybackBeatIndex;
    export type Segment = t.PlaybackSegment;

    /** Control enums */
    export type Phase = t.PlaybackPhase;
    export type Intent = t.PlaybackIntent;
    export type DeckId = t.PlaybackDeckId;
    export type DeckStatus = t.PlaybackDeckStatus;
  }
}
