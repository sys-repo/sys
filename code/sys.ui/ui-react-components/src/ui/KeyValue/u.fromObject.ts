import type React from 'react';
import type { t } from '../common.ts';

/**
 * Build `KeyValueItem[]` rows from a plain object.
 * - Respects insertion order of keys.
 * - Optional `filter(key, value)` to include/exclude rows.
 * - Optional `format(value)` to render values (defaults to a stringified representation).
 */
export const fromObject: t.KeyValueFromObject = (obj, options = {}) => {
  const items: t.KeyValueItem[] = [];
  const { filter, format } = options ?? {};

  if (!obj || typeof obj !== 'object') return items;

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
  if (value == null) return String(value); // null | undefined

  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'bigint') return value.toString();

  if (Array.isArray(value) || typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  // function, symbol, etc.
  return String(value);
}
