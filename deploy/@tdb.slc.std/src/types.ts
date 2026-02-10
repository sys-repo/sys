/**
 * @module types
 */
export type * from './ui/ui.Layout.Canvas/t.ts';
export type * from './ui/ui.Logo.Canvas/t.ts';
export type * from './ui/ui.Logo.Wordmark/t.ts';

/**
 * SLC Panels.
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
 * Canvas panels as a {map}.
 */
export type CanvasPanelPartialMap<T> = Partial<CanvasPanelMap<T>>;
export type CanvasPanelMap<T> = {
  [Panel in CanvasPanel]: T;
};
