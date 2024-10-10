import type { t } from '../common.ts';

/**
 * Helpers for working with JavaScript Object Notation (JSON)
 * (RFC-8259).
 */
export const Json: t.JsonLib = {
  stringify(input: any) {
    if (input === undefined) throw new Error(`[undefined] is not valid JSON input`);
    const text = JSON.stringify(input, null, 2);
    return text.includes('\n') ? `${text}\n` : text; // NB: trailing "new-line" only added if the JSON spans more than a single line
  },

  parse<T>(input: t.JsonString | undefined, defaultValue: T | (() => T)): T {
    return input === undefined ? wrangle.default(defaultValue) : JSON.parse(input);
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  default<T>(input: T | (() => T)): T {
    if (typeof input === 'function') return (input as () => T)();
    return input as T;
  },
} as const;
