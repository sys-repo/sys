/**
 * @module
 * Module types.
 */
export type * from './ui/App.Render/t.ts';
export type * from './ui/App.Layout/t.ts';
export type * from './ui/App.Signals/t.ts';
export type * from './ui/App/t.ts';

export type * from './ui/ui.Layout/t.ts';
export type * from './ui/ui.Logo.Canvas/t.ts';
export type * from './ui/ui.Logo.Wordmark/t.ts';
export type * from './ui/ui.Sheet/t.ts';
export type * from './ui/ui.Video.Background/t.ts';

export type * from './ui/ui.Landing-1/t.ts';
export type * from './ui/ui.Landing-2/t.ts';
export type * from './ui/ui.Landing-3/t.ts';

export type * from './ui/use/t.ts';

export type * from './-sample/-ui.Videos/t.ts';
export type * from './ui.Content/t.ts';

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
