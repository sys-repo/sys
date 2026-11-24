import { Color, type t } from './common.ts';

/**
 * Shared outline geometry and paint, independent of markup and interaction.
 */
export const outline: t.FocusStyle.Lib['outline'] = (prefix) => {
  return {
    base: { borderRadius: 1 },
    paint: {
      defaults: {
        [`${prefix}-accent`]: Color.BLUE,
        [`${prefix}-rest`]: Color.alpha(Color.BLUE, 0.2),
        [`${prefix}-width`]: '2px',
        [`${prefix}-offset`]: '2px',
      },
      arrival: { outlineColor: `var(${prefix}-accent)` },
      settled: {
        outline: `var(${prefix}-width) solid var(${prefix}-rest)`,
        outlineOffset: `var(${prefix}-offset)`,
      },
      forcedColors: {
        outline: `var(${prefix}-width) solid Highlight`,
        outlineOffset: `var(${prefix}-offset)`,
      },
    },
  };
};
