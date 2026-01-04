import type { t } from './common.ts';

type BeatIndex = t.TimecodeState.Playback.BeatIndex;
type Timeline = t.TimecodeState.Playback.Timeline;

/**
 * Minimal scheduler interface for pause-time materialization and polling.
 */
export type Schedule = {
  /** Monotonic `now` in milliseconds. */
  now(): number;

  /** Repeating timer; returns an opaque id. */
  setInterval(fn: () => void, ms: number): unknown;

  /** Cancel a timer created by setInterval. */
  clearInterval(id: unknown): void;
};

/**
 * Dual video deck signals.
 */
export type VideoDecks = {
  readonly A: t.VideoPlayerSignals;
  readonly B: t.VideoPlayerSignals;
};

/**
 * Resolve the media identity for a beat.
 * Returns <undefined> when the authoring context is missing required media.
 */
export type ResolveBeatMedia = (beat: BeatIndex) => ResolveBeatMediaResult | undefined;
export type ResolveBeatMediaResult = {
  readonly src: string;
  readonly slice?: t.Timecode.Slice.String | string;
};

/**
 * Bridge driver: executes reducer commands and emits reducer inputs.
 */
export type PlaybackDriver = t.DisposableLike & {
  /** Apply a reducer update (state + cmds/events). */
  apply(snapshot: t.TimecodeState.Playback.Snapshot): void;
};

/**
 * Create a pure TimelineController.
 */
export type TimelineController = {
  readonly init: (args: { timeline: Timeline; startBeat?: BeatIndex }) => void;
  readonly play: () => void;
  readonly pause: () => void;
  readonly toggle: () => void;
  readonly seekToBeat: (beat: BeatIndex) => void;
};
/** Low-level dispatch into the playback state machine. */
export type TimelineControllerDispatch = (input: t.TimecodeState.Playback.Input) => void;

/** Construction args for the playback driver. */
export type CreatePlaybackDriverArgs = {
  /** Deck runtimes keyed by reducer deck id. */
  readonly decks: VideoDecks;

  /** Beat → media resolver used by cmd:deck:load. */
  readonly resolveBeatMedia: ResolveBeatMedia;

  /** Outbound reducer input sink (runner/driver → ui-state). */
  readonly dispatch: (input: t.TimecodeState.Playback.Input) => void;

  /**
   * Scheduling host for timers/monotonic time.
   * If omitted, the driver uses the platform defaults.
   */
  readonly schedule?: Schedule;

  /** Enable driver diagnostics. */
  readonly log?: boolean;
};
