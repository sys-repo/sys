import type { t } from './common.ts';

/**
 * <Component>:
 */
export type VideoElementProps__OLD = {
  debug?: boolean;

  // State:
  video?: t.VideoPlayerSignals;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Events:
  onEnded?: t.VideoPlayerEndedHandler;
  onSeek?: t.PlayerControlSeekChangeHandler;
};

/**
 * VideoPlayer fade mask.
 */
export type VideoPlayerFadeMaskDirection = 'Top:Down' | 'Bottom:Up' | 'Left:Right' | 'Right:Left';
export type VideoPlayerFadeMask = {
  direction: VideoPlayerFadeMaskDirection;
  size?: t.Pixels;
  color?: string;
  opacity?: t.Percent;
};

/**
 * Events:
 */
export type VideoPlayerEndedHandler = (e: VideoPlayerEndedHandlerArgs) => void;
export type VideoPlayerEndedHandlerArgs = { video: t.VideoPlayerSignals };
