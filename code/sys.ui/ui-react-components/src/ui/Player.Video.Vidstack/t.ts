import type { MediaPlayerInstance, MediaPlayerProps } from '@vidstack/react';
import type { RefObject } from 'react';
import type { t } from './common.ts';

/** A React reference to the MediaPlayer instance. */
export type VidstackPlayerRef = RefObject<MediaPlayerInstance>;

/**
 * Component: Video Player.
 */
export type VidstackPlayerProps = {
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
  video?: t.VideoPlayerSignals;
  abs?: t.CssEdgesInput | boolean;
  show?: boolean;
  style?: t.CssInput;
};
