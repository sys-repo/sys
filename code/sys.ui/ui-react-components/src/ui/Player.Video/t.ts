import type { MediaPlayerInstance, MediaPlayerProps } from '@vidstack/react';
import type { RefObject } from 'react';
import type { t } from './common.ts';

export type * from './t.Signals.ts';

export type VideoPlayerFadeMaskDirection = 'Top:Down' | 'Bottom:Up' | 'Left:Right' | 'Right:Left';
export type VideoPlayerFadeMask = {
  direction: VideoPlayerFadeMaskDirection;
  size?: t.Pixels;
  color?: string;
  opacity?: t.Percent;
};

/** The address of a video (eg. "vimeo/499921561"). */
export type StringVideoAddress = string;

/** A React reference to the MediaPlayer instance. */
export type VideoPlayerRef = RefObject<MediaPlayerInstance>;

/** Structure representing a jump-to ("seek") location */
export type VideoPlayerJumpTo = { second: t.Secs; play: boolean };

/**
 * Component: Video Player.
 */
export type VideoPlayerProps = {
  debug?: boolean;
  title?: string;

  // State:
  signals?: t.VideoPlayerSignals;

  // Appearance:
  style?: t.CssInput;
  theme?: t.CommonTheme;

  // Events:
  onPlay?: MediaPlayerProps['onPlay'];
  onPlaying?: MediaPlayerProps['onPlaying'];
  onPause?: MediaPlayerProps['onPause'];
  onEnded?: MediaPlayerProps['onEnded'];
};
