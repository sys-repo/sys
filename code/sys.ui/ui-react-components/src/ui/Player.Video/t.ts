import type { MediaPlayerProps } from '@vidstack/react';
import type { t } from './common.ts';

export type StringVideoAddress = string;

/**
 * Signals factory
 */
export type PlayerSignalsFactory = (
  defaults?: PlayerSignalsFactoryDefaults,
) => t.VideoPlayerSignals;

/** Defaults passed to the signals API factory. */
export type PlayerSignalsFactoryDefaults = {
  src?: t.StringVideoAddress;
  loop?: boolean;
  showControls?: boolean;
  showFullscreenButton?: boolean;
  cornerRadius?: number;
  aspectRatio?: string;
  autoPlay?: boolean;
  muted?: boolean;
  background?: boolean;
};

/**
 * Signals API for dynamic control of the <VideoPlayer>.
 */
export type VideoPlayerSignals = {
  props: {
    ready: t.Signal<boolean>;
    src: t.Signal<t.StringVideoAddress>;

    /**
     * Media.
     */
    playing: t.Signal<boolean>;
    currentTime: t.Signal<t.Secs>;
    loop: t.Signal<boolean>;
    autoPlay: t.Signal<boolean>;
    muted: t.Signal<boolean>;

    /**
     * Appearance.
     */
    showControls: t.Signal<boolean>;
    showFullscreenButton: t.Signal<boolean>;
    /** A background video, covers the container running silently (and generally auto-plays). */
    background: t.Signal<boolean>;
    aspectRatio: t.Signal<string>;
    cornerRadius: t.Signal<number>;

    /**
     * Commands.
     */
    jumpTo: t.Signal<t.VideoPlayerJumpTo | undefined>;
  };
  jumpTo(second: t.Secs, options?: { play?: boolean }): VideoPlayerSignals;
  play(): VideoPlayerSignals;
  pause(): VideoPlayerSignals;
  toggle(playing?: boolean): VideoPlayerSignals;
};

/** Structure representing a jump-to ("seek") location */
export type VideoPlayerJumpTo = { second: t.Secs; play: boolean };

/**
 * Component: Video Player.
 */
export type VideoPlayerProps = {
  debug?: boolean;
  title?: string;
  style?: t.CssInput;

  // Events.
  onPlay?: MediaPlayerProps['onPlay'];
  onPlaying?: MediaPlayerProps['onPlaying'];
  onPause?: MediaPlayerProps['onPause'];

  // State.
  signals?: t.VideoPlayerSignals;
};
