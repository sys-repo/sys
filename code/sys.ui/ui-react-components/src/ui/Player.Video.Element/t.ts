import type { t } from './common.ts';

/**
 * <Component>:
 */
export type VideoElementProps = {
  debug?: boolean;

  // State:
  signals?: t.VideoPlayerSignals;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Events:
  onEnded?: t.VideoPlayerEndedHandler;
};

/**
 * Events:
 */
export type VideoPlayerEndedHandler = (e: VideoPlayerEndedHandlerArgs) => void;
export type VideoPlayerEndedHandlerArgs = { video: t.VideoPlayerSignals };
