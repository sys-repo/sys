/**
 * @module
 * Module types.
 */
export type * from './ui/ui.Canvas.Mini/t.ts';
export type * from './ui/ui.Logo/t.ts';
export type * from './ui/ui.Video.Tubes/t.ts';

export type * from './ui/ui.Landing-1/t.ts';
export type * from './ui/ui.Landing-2/t.ts';

export type * from './-sample/-ui.Videos/t.ts';

/**
 * Panels.
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
