import type { t } from './common.ts';

/**
 * <Component>: Mini Canvas
 */
export type LogoCanvasProps = {
  selected?: t.CanvasPanel | t.CanvasPanel[];
  selectionAnimation?: LogoCanvasSelectionAnimation;
  over?: t.CanvasPanel;
  width?: number;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onPanelEvent?: t.LogoCanvasPanelHandler;
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
  type: 'enter' | 'leave' | 'click';
  panel: t.CanvasPanel;
};
