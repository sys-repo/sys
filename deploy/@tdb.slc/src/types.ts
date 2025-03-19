/**
 * @module
 * Module types.
 */
export type * from './ui/-tmp/t.ts';
export type * from './ui/ui.Canvas.Mini/t.ts';
export type * from './ui/ui.Landing/t.ts';

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
