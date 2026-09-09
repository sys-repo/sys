import { Is, type t } from './common.ts';

/**
 * Ensure numbers are converted to pixels.
 */
export function formatGap(style: t.Style.Value) {
  const updates: Partial<t.Style.Props> = {};

  for (const key of ['gap', 'columnGap', 'rowGap'] as const) {
    const v = style[key];
    if (Is.num(v)) updates[key] = `${v}px`;
  }

  return Object.keys(updates).length > 0 ? { ...style, ...updates } : style;
}
