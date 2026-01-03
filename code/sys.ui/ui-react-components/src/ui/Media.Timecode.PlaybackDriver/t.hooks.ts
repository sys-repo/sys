import type { t } from './common.ts';
import type * as R from './t.runtime.ts';

type Input = t.TimecodeState.Playback.Input;
type State = t.TimecodeState.Playback.State;
type Update = t.TimecodeState.Playback.Update;
type CreateDriverArgs = Omit<R.CreatePlaybackDriverArgs, 'dispatch'>;

/** Arguments for the React playback driver hook. */
export type UsePlaybackDriverArgs = CreateDriverArgs & {
  /** Optional init args forwarded to ui-state machine.init(...) */
  init?: Parameters<t.TimecodeState.Playback.Lib['init']>[0];
};

/**
 * Result surface returned by the playback driver hook.
 */
export type UsePlaybackDriverResult = {
  /** Imperative control surface bound to the active driver instance. */
  readonly controller: R.TimelineController;

  /** Current reducer state of the playback machine. */
  readonly state: State;

  /** Last reducer update (state + causal metadata). */
  readonly update: Update;

  /** Low-level dispatch into the playback state machine. */
  readonly dispatch: (input: Input) => void;
};

/** Arguments for the pure playback timeline projection hook. */
export type UsePlaybackTimelineArgs<P = unknown> = {
  /** Authoring-time playback specification (composition + beats). */
  spec?: t.Timecode.Playback.Spec<P>;
};

/**
 * Result of projecting a playback spec into timeline representations.
 */
export type UsePlaybackTimelineResult<P = unknown> = {
  /** Resolved composite timeline with diagnostics and segment structure. */
  readonly resolved?: t.Timecode.Composite.Resolved;

  /**
   * @sys/std semantic timeline (authoring + payload view).
   * - timeline.duration exists
   * - beat.src / beat.payload exist
   */
  readonly experience?: t.Timecode.Experience.Timeline<P>;

  /**
   * @sys/ui-state machine timeline (small working model).
   * - timeline.virtualDuration exists
   */
  readonly playback?: t.TimecodeState.Playback.Timeline;
};
