/**
 * @module
 * Module types.
 */
export type * from './ui/App.Content/t.ts';
export type * from './ui/App.Signals/t.ts';
export type * from './ui/use/t.ts';

export type * from './ui/ui.Canvas.Mini/t.ts';
export type * from './ui/ui.Logo/t.ts';
export type * from './ui/ui.Sheet/t.ts';
export type * from './ui/ui.Video.Background/t.ts';

export type * from './ui/m.Layout/t.ts';
export type * from './ui/ui.Layout/t.ts';

export type * from './ui/ui.Landing-1/t.ts';
export type * from './ui/ui.Landing-2/t.ts';
export type * from './ui/ui.Landing-3/t.ts';

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
