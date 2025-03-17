import type { MediaPlayerProps } from '@vidstack/react';
import type { t } from './common.ts';

/**
 * Signals factory
 */
export type PlayerSignalsFactory = (
  defaults?: PlayerSignalsFactoryDefaults,
) => t.VideoPlayerSignals;

/** Defaults passed to the signals API factory. */
export type PlayerSignalsFactoryDefaults = { fullscreenButton?: boolean; loop?: boolean };

/**
 * Signals API for dynamic control of the <VideoPlayer>.
 */
export type VideoPlayerSignals = {
  props: {
    ready: t.Signal<boolean>;
    playing: t.Signal<boolean>;
    loop: t.Signal<boolean>;
    currentTime: t.Signal<t.Secs>;
    fullscreenButton: t.ReadonlySignal<boolean>;
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
  video?: string;
  style?: t.CssInput;

  // Events.
  onPlay?: MediaPlayerProps['onPlay'];
  onPlaying?: MediaPlayerProps['onPlaying'];
  onPause?: MediaPlayerProps['onPause'];

  // State.
  signals?: t.VideoPlayerSignals;
};
