import type { t } from './common.ts';
export type * from './t.Edges.ts';

/**
 * CSS styling tools.
 */
export type StyleLib = {
  readonly Color: t.ColorLib;
  readonly Edges: t.CssEdgesLib;

  readonly toMargins: t.CssEdgesLib['toMargins'];
  readonly toPadding: t.CssEdgesLib['toPadding'];
};
