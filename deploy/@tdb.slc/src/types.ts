/**
 * @module
 * Module types.
 */
export type * from './ui/m.Signals/t.ts';
export type * from './ui/use/t.ts';

export type * from './ui/ui.Canvas.Mini/t.ts';
export type * from './ui/ui.Logo/t.ts';
export type * from './ui/ui.Video.Background.Tubes/t.ts';

export type * from './ui/ui.Layout.Mobile/t.ts';
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

/**
 * The content stages of the view.
 */
export type Stage = 'Entry' | 'Trailer' | 'Overview' | 'Programme';
