import type { t } from './common.ts';
export type * from './t.api.ts';

/**
 * <Component>:
 */
export type VimeoBackgroundProps = {
  video?: number | t.StringVideoAddress;

  playing?: boolean;
  /**
   * The delay before the play/stop change takes effect.
   * Useful when composing into bigger transitioning based compositions.
   */
  playingTransition?: t.Msecs;
  jumpTo?: t.Secs;

  opacity?: number;
  opacityTransition?: t.Msecs;

  blur?: number;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onReady?: VimeoReadyHandler;
};

/**
 * Events
 */
export type VimeoReadyHandler = (e: VimeoReadyHandlerArgs) => void;
export type VimeoReadyHandlerArgs = t.VimeoIFrame;
