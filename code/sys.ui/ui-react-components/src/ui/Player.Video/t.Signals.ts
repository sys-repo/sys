import type { t } from './common.ts';

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
  showControls?: boolean;
  showFullscreenButton?: boolean;
  showVolumeControl?: boolean;
  cornerRadius?: number;
  aspectRatio?: string;
  scale?: number | t.VideoPlayerScale;
  autoPlay?: boolean;
  muted?: boolean;
  background?: boolean;
};

/**
 * Signals API for dynamic control of the <VideoPlayer>.
 */
export type VideoPlayerSignals = {
  readonly props: VideoPlayerSignalProps;
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
  readonly currentTime: t.Signal<t.Secs>;
  readonly loop: t.Signal<boolean>;
  readonly autoPlay: t.Signal<boolean>;
  readonly muted: t.Signal<boolean>;

  /**
   * Appearance:
   */
  readonly showControls: t.Signal<boolean>;
  readonly showFullscreenButton: t.Signal<boolean>;
  readonly showVolumeControl: t.Signal<boolean>;
  /** A background video, covers the container running silently (and generally auto-plays). */
  readonly background: t.Signal<boolean>;
  readonly aspectRatio: t.Signal<string>;
  readonly cornerRadius: t.Signal<number>;
  readonly scale: t.Signal<number | t.VideoPlayerScale>;

  /**
   * Commands:
   */
  readonly jumpTo: t.Signal<t.VideoPlayerJumpTo | undefined>;
};

/** Structure representing a jump-to ("seek") location */
export type VideoPlayerJumpTo = { second: t.Secs; play: boolean };

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
