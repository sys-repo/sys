import type { t } from './common.ts';

export type * from './t.composite.ts';
export type * from './t.helpers.ts';

/**
 * Component:
 */
export type CompositeVideoProps = {
  /** Ordered pieces to stitch together. */
  videos?: t.VideoCompositionSpec;

  /** Known durations (ms) per src; if omitted, you may probe. */
  durations?: t.VideoDurationMap;

  /** Optional duration loader; host can override the default probe. */
  durationsProbe?: (srcs: readonly string[]) => Promise<t.VideoDurationMap>;

  /** Initial virtual time. Default: 0. */
  startAt?: t.VideoVTime;

  /** Handoff buffer before segment end (ms). Default: 250. */
  handoff?: t.Msecs;

  /** Loop the composite timeline. */
  loop?: boolean;

  /**
   * Playback control:
   * - If `playing` is defined => controlled.
   * - Else `autoPlay` seeds initial intent (default false here).
   */
  playing?: boolean;
  autoPlay?: boolean;

  /**
   * Mute control:
   * - If `muted` is defined => controlled.
   * - Else `defaultMuted` seeds initial.
   */
  muted?: boolean;
  defaultMuted?: boolean;

  /**
   * Visual pass-through to the underlying <VideoElement>.
   * Keep UI light: only appearance/controls, no src/seek here.
   */
  readonly element?: Pick<
    t.VideoElementProps,
    | 'aspectRatio'
    | 'cornerRadius'
    | 'scale'
    | 'fadeMask'
    | 'showControls'
    | 'showFullscreenButton'
    | 'showVolumeControl'
    | 'controls'
  >;

  /** Fired after resolution; provides total virtual duration. */
  onReady?: VideoCompositeReadyHandler;

  /** Virtual time updates; also surfaces current segment. */
  onTimeUpdate?: VideoCompositeTimeHandler;

  /** End of last segment (or loop boundary if loop is true). */
  onEnded?: VideoCompositeEndedHandler;

  /** Mirror element-level state changes at the composite level. */
  onPlayingChange?: VideoCompositePlayingChangeHandler;
  onMutedChange?: VideoCompositeMutedChangeHandler;
  onBufferingChange?: VideoCompositeBufferingChangeHandler;
  onBufferedChange?: VideoCompositeBufferedChangeHandler;

  /** Standard view props. */
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Events:
 */

/** Fired once composition is resolved. */
export type VideoCompositeReady = {
  readonly total: t.Msecs;
  readonly resolved: t.VideoCompositionResolved;
};
/** Handler for `onReady`. */
export type VideoCompositeReadyHandler = (e: VideoCompositeReady) => void;

/** Virtual timeline update event. */
export type VideoCompositeTime = {
  readonly v: t.VideoVTime;
  readonly index: number;
  readonly seg: t.VideoResolvedSegment;
};
/** Handler for `onTimeUpdate`. */
export type VideoCompositeTimeHandler = (e: VideoCompositeTime) => void;

/** Fired at end of last segment (or loop boundary). */
export type VideoCompositeEndedHandler = () => void;

/** Playback state change event. */
export type VideoCompositePlayingChange = {
  readonly playing: boolean;
  readonly reason: t.VideoPlayerEventReason;
};
/** Handler for `onPlayingChange`. */
export type VideoCompositePlayingChangeHandler = (e: VideoCompositePlayingChange) => void;

/** Mute state change event. */
export type VideoCompositeMutedChange = {
  readonly muted: boolean;
  readonly reason: t.VideoPlayerEventReason;
};
/** Handler for `onMutedChange`. */
export type VideoCompositeMutedChangeHandler = (e: VideoCompositeMutedChange) => void;

/** Buffering state change event. */
export type VideoCompositeBufferingChange = {
  readonly buffering: boolean;
  readonly reason: t.VideoPlayerEventReason;
};
/** Handler for `onBufferingChange`. */
export type VideoCompositeBufferingChangeHandler = (e: VideoCompositeBufferingChange) => void;

/** Buffered percent update event. */
export type VideoCompositeBufferedChange = {
  readonly buffered: t.Percent;
  readonly reason: t.VideoPlayerEventReason;
};
/** Handler for `onBufferedChange`. */
export type VideoCompositeBufferedChangeHandler = (e: VideoCompositeBufferedChange) => void;
