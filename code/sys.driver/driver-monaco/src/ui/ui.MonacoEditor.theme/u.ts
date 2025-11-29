import { type t, Color } from './common.ts';

/**
 * Helpers:
 */
export function hex(base: string) {
  const darken = (by: number) => Color.toHex(Color.darken(base, by));
  const lighten = (by: number) => Color.toHex(Color.lighten(base, by));
  return { base, darken, lighten } as const;
}

/**
 * Apply alpha to a base hex and return #RRGGBBAA.
 */
export function alpha(color: t.StringHex, a: number): t.StringHex {
  return Color.toHex(Color.alpha(color, a));
}
