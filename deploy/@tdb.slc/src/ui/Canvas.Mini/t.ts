import type { t } from './common.ts';

/**
 * <Component>: Mini Canvas
 */
export type CanvasMiniProps = {
  width?: number;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Panels
 */
export type CanvasPanel =
  | 'purpose'
  | 'impact'
  | 'problem'
  | 'solution'
  | 'metrics'
  | 'uvp'
  | 'advantage'
  | 'channels'
  | 'customers'
  | 'costs'
  | 'revenue';

/**
 * Events
 */
export type CanvasPanelEvent = { type: 'enter' | 'leave' | 'click'; panel: t.CanvasPanel };
export type CanvasPanelEventHandler = (e: CanvasPanelEvent) => void;
