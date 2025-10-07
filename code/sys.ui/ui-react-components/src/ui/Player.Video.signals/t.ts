import type { t } from './common.ts';

/** The address of a video (eg. "vimeo/499921561"). */
export type StringVideoAddress = string;

/**
 * Signals:
 */
export type PlayerSignalsFactory = (
  defaults?: PlayerSignalsFactoryDefaults | t.StringVideoAddress,
) => t.VideoPlayerSignals;

/**
 * Signals API for dynamic control of the <VideoPlayer>.
 */
export type VideoPlayerSignals = {
  readonly instance: t.StringId;
  readonly props: VideoPlayerSignalProps;
  readonly is: VideoPlayerIs;
  readonly src: t.StringVideoAddress | undefined;
  jumpTo(second: t.Secs, options?: { play?: boolean }): VideoPlayerSignals;
  play(): VideoPlayerSignals;
  pause(): VideoPlayerSignals;
  toggle(playing?: boolean): VideoPlayerSignals;
};

/** The raw signal properties that make up the VideoPlayer signals API/. */
export type VideoPlayerSignalProps = Readonly<{
  ready: t.Signal<boolean>;
  src: t.Signal<t.StringVideoAddress | undefined>;

  /**
   * Media:
   */
  playing: t.Signal<boolean>;
  loop: t.Signal<boolean>;
  autoPlay: t.Signal<boolean>;
  muted: t.Signal<boolean>;

  currentTime: t.Signal<t.Secs>;
  duration: t.Signal<t.Secs>;
  buffering: t.Signal<boolean>;
  buffered: t.Signal<t.Secs | undefined>;
  crop: t.Signal<t.VideoCropRange | t.VideoCropRangeTuple | undefined>;

  /**
   * Appearance:
   */
  showControls: t.Signal<boolean | undefined>;
  showFullscreenButton: t.Signal<boolean | undefined>;
  showVolumeControl: t.Signal<boolean | undefined>;
  aspectRatio: t.Signal<string | undefined>;
  cornerRadius: t.Signal<number | undefined>;
  scale: t.Signal<t.Percent | t.VideoPlayerScale | undefined>;
  fadeMask: t.Signal<t.VideoPlayerFadeMask | undefined>;

  /**
   * Commands:
   */
  jumpTo: t.Signal<t.VideoPlayerSeek | undefined>;
}>;

/** Defaults passed to the signals API factory. */
export type PlayerSignalsFactoryDefaults = {
  src?: t.StringVideoAddress;
  loop?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  crop?: t.VideoCropRange | t.VideoCropRangeTuple;

  // Apperance:
  showControls?: boolean;
  showFullscreenButton?: boolean;
  showVolumeControl?: boolean;
  cornerRadius?: number;
  aspectRatio?: string;
  scale?: number | t.VideoPlayerScale;
  fadeMask?: t.VideoPlayerFadeMask | t.Pixels;
};

/** Structure representing a jump-to ("seek") location */
export type VideoPlayerSeek = {
  /** Positive = absolute seconds, negative = from the end (-5 → 5s before end). */
  second: t.Secs;
  /** Play after seeking?  (default = leave play/pause state unchanged). */
  play?: boolean;
};

/**
 * Boolean flags for the video player.
 */
export type VideoPlayerIs = {
  readonly playing: boolean;
  readonly paused: boolean;
};

/**
 * A function that calculates the scale transform to apply to the
 * video-player based on it's current size and aspect ratio.
 */
export type VideoPlayerScale = (e: VideoPlayerScaleArgs) => t.Percent;
export type VideoPlayerScaleArgs = {
  readonly width: t.Pixels;
  readonly height: t.Pixels;
  enlargeBy(increment: t.Pixels): t.Percent;
};

/**
 * Visual mask that fades in from an edge.
 */
export type VideoPlayerFadeMaskDirection = 'Top:Down' | 'Bottom:Up' | 'Left:Right' | 'Right:Left';
export type VideoPlayerFadeMask = {
  direction: VideoPlayerFadeMaskDirection;
  size?: t.Pixels;
  color?: string;
  opacity?: t.Percent;
};
