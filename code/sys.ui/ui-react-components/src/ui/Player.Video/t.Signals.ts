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
  scale?: number;
  autoPlay?: boolean;
  muted?: boolean;
  background?: boolean;
};

/**
 * Signals API for dynamic control of the <VideoPlayer>.
 */
export type VideoPlayerSignals = {
  readonly props: {
    readonly ready: t.Signal<boolean>;
    readonly src: t.Signal<t.StringVideoAddress | undefined>;

    /**
     * Media.
     */
    readonly playing: t.Signal<boolean>;
    readonly currentTime: t.Signal<t.Secs>;
    readonly loop: t.Signal<boolean>;
    readonly autoPlay: t.Signal<boolean>;
    readonly muted: t.Signal<boolean>;

    /**
     * Appearance.
     */
    readonly showControls: t.Signal<boolean>;
    readonly showFullscreenButton: t.Signal<boolean>;
    readonly showVolumeControl: t.Signal<boolean>;
    /** A background video, covers the container running silently (and generally auto-plays). */
    readonly background: t.Signal<boolean>;
    readonly aspectRatio: t.Signal<string>;
    readonly cornerRadius: t.Signal<number>;
    readonly scale: t.Signal<number>;

    /**
     * Commands.
     */
    readonly jumpTo: t.Signal<t.VideoPlayerJumpTo | undefined>;
  };
  jumpTo(second: t.Secs, options?: { play?: boolean }): VideoPlayerSignals;
  play(): VideoPlayerSignals;
  pause(): VideoPlayerSignals;
  toggle(playing?: boolean): VideoPlayerSignals;
};

/** Structure representing a jump-to ("seek") location */
export type VideoPlayerJumpTo = { second: t.Secs; play: boolean };
