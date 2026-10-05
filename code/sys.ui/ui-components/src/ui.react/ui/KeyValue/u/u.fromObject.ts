import type React from 'react';
import { Is, type t } from '../common.ts';

/**
 * Build `KeyValue.Item[]` rows from a plain object.
 * - Respects insertion order of keys.
 * - Optional `filter(key, value)` to include/exclude rows.
 * - Optional `format(value)` to render values (defaults to a stringified representation).
 */
export const fromObject: t.KeyValue.FromObject = (obj, options = {}) => {
  const items: t.KeyValue.Item[] = [];
  const { filter, format } = options ?? {};

  if (!Is.object(obj)) return items;

  for (const [key, value] of Object.entries(obj)) {
    if (filter && !filter(key, value)) continue;
    const v: React.ReactNode = format ? format(value) : defaultFormat(value);
    items.push({ kind: 'row', k: key, v });
  }

  return items;
};

/**
 * Default value formatter:
 * - primitives → string
 * - bigints → string (no "n" suffix)
 * - objects/arrays → JSON (compact)
 * - functions/symbols/unknown → String(value)
 */
function defaultFormat(value: unknown): string {
  if (Is.nil(value)) return String(value); // null | undefined

  if (Is.string(value)) return value;
  if (Is.number(value) || Is.bool(value)) return String(value);

  if (Is.object(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  // function, symbol, etc.
  return String(value);
}
