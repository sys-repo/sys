/**
 * @module
 * Module types.
 */
export type * from './ui/Canvas.Mini/t.ts';
export type * from './ui/Foo/t.ts';

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
