import type { t } from './common.ts';

/**
 * <Component>: Mini Canvas
 */
export type LogoCanvasProps = {
  selected?: t.CanvasPanel;
  over?: t.CanvasPanel;
  width?: number;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onPanelEvent?: t.LogoCanvasPanelHandler;
};

/**
 * Events
 */
export type LogoCanvasPanelHandler = (e: LogoCanvasPanelHandlerArgs) => void;
export type LogoCanvasPanelHandlerArgs = {
  type: 'enter' | 'leave' | 'click';
  panel: t.CanvasPanel;
};
