import type { t } from '../common.ts';

/**
 * Helpers for working with JavaScript Object Notation (JSON)
 * (RFC-8259).
 */
export const Json: t.JsonLib = {
  stringify(input: any, space: string | number = 2) {
    if (input === undefined) throw new Error(`[undefined] is not valid JSON input`);
    const replacer = getCircularReplacer();
    const text = JSON.stringify(input, replacer, space);
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

function getCircularReplacer(): (key: string, value: any) => any {
  const seen = new WeakSet<object>();
  return (_key: string, value: any): any => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  };
}
