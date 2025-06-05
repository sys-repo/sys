import type { MediaPlayerInstance, MediaPlayerProps } from '@vidstack/react';
import type { RefObject } from 'react';
import type { t } from './common.ts';

/** The address of a video (eg. "vimeo/499921561"). */
export type StringVideoAddress = string;

/** A React reference to the MediaPlayer instance. */
export type VideoPlayerRef = RefObject<MediaPlayerInstance>;

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

/**
 * Component: Elapsed Time (Debug).
 */
export type ElapsedTimeProps = {
  player?: t.VideoPlayerSignals;
  abs?: t.CssEdgesInput | boolean;
  show?: boolean;
  style?: t.CssInput;
};

/**
 * Fade mask.
 */
export type VideoPlayerFadeMaskDirection = 'Top:Down' | 'Bottom:Up' | 'Left:Right' | 'Right:Left';
export type VideoPlayerFadeMask = {
  direction: VideoPlayerFadeMaskDirection;
  size?: t.Pixels;
  color?: string;
  opacity?: t.Percent;
};
