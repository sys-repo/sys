import type { t } from './common.ts';

/**
 * Minimal scheduler interface for pause-time materialization and polling.
 */
export type DriverSchedule = {
  /** Monotonic `now` in milliseconds. */
  now(): number;

  /** Repeating timer; returns an opaque id. */
  setInterval(fn: () => void, ms: number): unknown;

  /** Cancel a timer created by setInterval. */
  clearInterval(id: unknown): void;
};

/**
 * Resolve the media identity for a beat.
 * Returns undefined when the authoring context is missing required media.
 */
export type ResolveBeatMedia = (
  beat: t.TimecodeState.Playback.BeatIndex,
) => { readonly src: string; readonly slice?: t.Timecode.Slice.String | string } | undefined;

/**
 * Bridge driver: executes reducer commands and emits reducer inputs.
 */
export type PlaybackDriver = t.DisposableLike & {
  /** Apply a reducer update (state + cmds/events). */
  apply(update: t.TimecodeState.Playback.Update): void;
};

/**
 * Construction args for the playback driver.
 */
export type CreatePlaybackDriverArgs = {
  /** Deck runtimes keyed by reducer deck id. */
  readonly decks: { readonly [K in t.TimecodeState.Playback.DeckId]: t.VideoPlayerSignals };

  /** Beat → media resolver used by cmd:deck:load. */
  readonly resolveBeatMedia: ResolveBeatMedia;

  /** Outbound reducer input sink (runner/driver → ui-state). */
  readonly dispatch: (input: t.TimecodeState.Playback.Input) => void;

  /**
   * Scheduling host for timers/monotonic time.
   * If omitted, the driver uses the platform defaults.
   */
  readonly schedule?: DriverSchedule;

  /** Enable driver diagnostics. */
  readonly log?: boolean;
};
