/**
 * @module
 * Module types.
 */

/**
 * UI: logical "App" state.
 */
export type * from './ui/App.Layout/t.ts';
export type * from './ui/App.Render/t.ts';
export type * from './ui/App.Signals.Controller/t.ts';
export type * from './ui/App.Signals/t.ts';
export type * from './ui/App/t.ts';

/**
 * UI Structure:
 */
export type * from './ui/ui.Layout/t.ts';
export type * from './ui/ui.Logo.Canvas/t.ts';
export type * from './ui/ui.Logo.Wordmark/t.ts';
export type * from './ui/ui.Sheet/t.ts';
export type * from './ui/ui.TooSmall/t.ts';
export type * from './ui/ui.Video.Background/t.ts';

export type * from './ui/ui.Landing-1/t.ts';
export type * from './ui/ui.Landing-2/t.ts';
export type * from './ui/ui.Landing-3/t.ts';

export type * from './ui/use/t.ts';

/**
 * UI Content:
 */
export type * from './ui.Content/m.Content/t.ts';
export type * from './ui.Content/m.Factory/t.ts';
export type * from './ui.Content/t.ts';
export type * from './ui.Content/ui/t.ts';
export type * from './ui.Content/ui/ui.CanvasSlug/t.ts';
export type * from './ui.Content/ui/ui.FadeText/t.ts';
export type * from './ui.Content/ui/ui.Image/t.ts';
export type * from './ui.Content/ui/ui.Pulldown/t.ts';

export type * from './ui.Content/-sample/ui.Videos/t.ts';

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
