import type { t } from './common.ts';

/**
 * <Component>: Mini Canvas
 */
export type LogoCanvasProps = {
  selected?: t.CanvasPanel | t.CanvasPanel[];
  selectionAnimation?: LogoCanvasSelectionAnimation | boolean;
  over?: t.CanvasPanel;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onPanelEvent?: t.LogoCanvasPanelHandler;
  onReady?: () => void;
};

/** Selection animation options */
export type LogoCanvasSelectionAnimation = {
  /** Cycle back to the beginning when animation completes. */
  loop?: boolean;
  delay?: t.Msecs;
};

/**
 * Events
 */
export type LogoCanvasPanelHandler = (e: LogoCanvasPanelHandlerArgs) => void;
export type LogoCanvasPanelHandlerArgs = {
  event: 'enter' | 'leave' | 'click';
  panel: t.CanvasPanel;
  modifier: t.KeyboardModifierFlags;
};
