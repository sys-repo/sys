import type { t } from './common.ts';

/** The address of a video (eg. "vimeo/499921561"). */
export type StringVideoAddress = string;

/**
 * Signals:
 */
export type PlayerSignalsFactory = (
  defaults?: PlayerSignalsFactoryDefaults | t.StringVideoAddress,
) => t.VideoPlayerSignals;

/** Defaults passed to the signals API factory. */
export type PlayerSignalsFactoryDefaults = {
  src?: t.StringVideoAddress;
  loop?: boolean;
  autoPlay?: boolean;
  muted?: boolean;

  // Apperance:
  showControls?: boolean;
  showFullscreenButton?: boolean;
  showVolumeControl?: boolean;
  cornerRadius?: number;
  aspectRatio?: string;
  scale?: number | t.VideoPlayerScale;
  fadeMask?: t.VideoPlayerFadeMask | t.Pixels;
};

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
export type VideoPlayerSignalProps = {
  readonly ready: t.Signal<boolean>;
  readonly src: t.Signal<t.StringVideoAddress | undefined>;

  /**
   * Media:
   */
  readonly playing: t.Signal<boolean>;
  readonly loop: t.Signal<boolean>;
  readonly autoPlay: t.Signal<boolean>;
  readonly muted: t.Signal<boolean>;

  readonly currentTime: t.Signal<t.Secs>;
  readonly duration: t.Signal<t.Secs>;
  readonly buffering: t.Signal<boolean>;
  readonly buffered: t.Signal<t.Secs | undefined>;

  /**
   * Appearance:
   */
  readonly showControls: t.Signal<boolean>;
  readonly showFullscreenButton: t.Signal<boolean>;
  readonly showVolumeControl: t.Signal<boolean>;
  readonly aspectRatio: t.Signal<string>;
  readonly cornerRadius: t.Signal<number>;
  readonly scale: t.Signal<t.Percent | t.VideoPlayerScale>;
  readonly fadeMask: t.Signal<undefined | t.VideoPlayerFadeMask>;

  /**
   * Commands:
   */
  readonly jumpTo: t.Signal<t.VideoPlayerSeekCmd | undefined>;
};

/** Structure representing a jump-to ("seek") location */
export type VideoPlayerSeekCmd = {
  /** Positive = absolute seconds, negative = from the end (-5 → 5 s before end) */
  second: t.Secs;
  /** Play after seeking?  (default = leave play/pause state unchanged) */
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
 * video-player based on
 *
 */
export type VideoPlayerScale = (e: VideoPlayerScaleArgs) => t.Percent;
export type VideoPlayerScaleArgs = {
  readonly width: t.Pixels;
  readonly height: t.Pixels;
  enlargeBy(increment: t.Pixels): t.Percent;
};
