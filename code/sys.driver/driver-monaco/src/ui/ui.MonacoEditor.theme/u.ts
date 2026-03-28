import { type t, Color } from './common.ts';

/**
 * Helpers:
 */
const asHex = (input: string, fallback: t.StringHex): t.StringHex => {
  return Color.toHex(input) ?? fallback;
};

export function hex(base: t.StringHex) {
  const darken = (by: number) => asHex(Color.darken(base, by), base);
  const lighten = (by: number) => asHex(Color.lighten(base, by), base);
  return { base, darken, lighten } as const;
}

/**
 * Apply alpha to a base hex and return #RRGGBBAA.
 */
export function alpha(color: t.StringHex, a: number): t.StringHex {
  return asHex(Color.alpha(color, a), color);
}
