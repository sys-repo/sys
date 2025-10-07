import { type t, isRecord } from './common.ts';

export const Walk: t.IconSwatchesLib['Walk'] = {
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

/**
 * Depth-first walk that yields `[path, renderer]`,
 * where `path` is an array of keys/indices (t.ObjectPath).
 */
function* walkIcons(obj: unknown, path: t.ObjectPath = []): Generator<t.IconSwatchItem> {
  // Arrays (allow numeric indices in the path)
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const value = obj[i];
      const next = [...path, i] as t.ObjectPath;
      if (isIconRenderer(value)) {
        yield [next, value];
      } else {
        yield* walkIcons(value, next);
      }
    }
    return;
  }

  // Plain objects:
  if (!isRecord(obj)) return;
  for (const [key, value] of Object.entries(obj)) {
    const next = [...path, key] as t.ObjectPath;
    if (isIconRenderer(value)) {
      yield [next, value];
    } else {
      yield* walkIcons(value, next);
    }
  }
}
