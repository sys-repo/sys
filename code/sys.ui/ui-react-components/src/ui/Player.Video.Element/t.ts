import type { t } from './common.ts';

/**
 * <Component>:
 */
export type VideoElementProps = {
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
 * Events:
 */
export type VideoPlayerEndedHandler = (e: VideoPlayerEndedHandlerArgs) => void;
export type VideoPlayerEndedHandlerArgs = { video: t.VideoPlayerSignals };
