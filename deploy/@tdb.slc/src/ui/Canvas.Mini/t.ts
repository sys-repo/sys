import type { t } from './common.ts';

/**
 * <Component>: Mini Canvas
 */
export type CanvasMiniProps = {
  selected?: t.CanvasPanel;
  over?: t.CanvasPanel;
  width?: number;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onPanelEvent?: t.CanvasPanelEventHandler;
};

/**
 * Events
 */
export type CanvasPanelEvent = { type: 'enter' | 'leave' | 'click'; panel: t.CanvasPanel };
export type CanvasPanelEventHandler = (e: CanvasPanelEvent) => void;
