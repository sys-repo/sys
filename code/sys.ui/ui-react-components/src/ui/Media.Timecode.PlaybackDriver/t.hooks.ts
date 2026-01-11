import type { t } from './common.ts';
import type * as R from './t.runtime.ts';

type Snapshot = t.TimecodeState.Playback.Snapshot;
type CreateDriverArgs = Omit<R.CreatePlaybackDriverArgs, 'dispatch' | 'decks'> & {
  decks?: R.VideoDecks;
};

/**
 * Arguments for the React playback driver hook.
 */
export type UsePlaybackDriverArgs = CreateDriverArgs & {
  /** Forwarded verbatim to ui-state Playback.init(...) */
  init?: t.TimecodeState.Playback.InitArgs;

  /** Emits on every snapshot update (caller-owned side effects). */
  onSnapshot?: (e: { readonly snapshot?: Snapshot }) => void;
};

/**
 * Result surface returned by the playback driver hook.
 */
export type UsePlaybackDriverResult = {
  /** Imperative control surface bound to the active driver instance. */
  readonly controller: R.TimelineController;

  /** Last reducer update (state + causal metadata). */
  readonly snapshot: t.TimecodeState.Playback.Snapshot;

  /** Low-level dispatch into the playback state machine. */
  readonly dispatch: R.TimelineControllerDispatch;
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
