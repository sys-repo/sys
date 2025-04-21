import { type t } from './common.ts';

/**
 * Ensure numbers are converted to pixels.
 */
export function formatGap(style: t.CssValue) {
  const updates: Partial<t.CssProps> = {};

  for (const key of ['gap', 'columnGap', 'rowGap'] as const) {
    const v = style[key];
    if (typeof v === 'number') updates[key] = `${v}px`;
  }

  return Object.keys(updates).length > 0 ? { ...style, ...updates } : style;
}
