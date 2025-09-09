import { type t, isRecord } from './common.ts';

export const Walk = {
  icons(obj: unknown): t.IconSwatchItem[] {
    return Array.from(walkIcons(obj));
  },
} as const;

/**
 * Helpers:
 */
function isIconRenderer(v: unknown): v is t.IconRenderer {
  return typeof v === 'function';
}

function* walkIcons(obj: unknown): Generator<t.IconSwatchItem> {
  if (!isRecord(obj)) return;
  for (const [key, value] of Object.entries(obj)) {
    if (isIconRenderer(value)) {
      yield [key, value];
    } else if (isRecord(value)) {
      yield* walkIcons(value);
    }
  }
}
