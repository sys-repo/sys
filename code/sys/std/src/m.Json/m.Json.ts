import { type t, Delete, Err } from './common.ts';
import type { JsonLib } from './t.ts';

type JsonInput = t.JsonString | undefined;

/**
 * Helpers for working with JavaScript Object Notation (JSON)
 * (RFC-8259).
 */
export const Json: JsonLib = {
  stringify(input: any, space: string | number = 2) {
    if (input === undefined) throw new Error(`[undefined] is not valid JSON input`);
    const replacer = getCircularReplacer();
    const text = JSON.stringify(input, replacer, space);
    return text.includes('\n') ? `${text}\n` : text; // NB: trailing "new-line" only added if the JSON spans more than a single line
  },

  /**
   * Parse a JSON string (or return the default/undefined) - throws.
   *
   * Overload 1: `parse<T>(input)` → `T | undefined`
   * Overload 2: `parse<T>(input, default)` → `T`
   */
  parse<T>(...args: any[]) {
    const input = args[0] as JsonInput;
    const defaultValue = args[1] as t.JsonParseDefault<T>;

    if (input === undefined) {
      return defaultValue !== undefined ? (wrangle.default(defaultValue) as T) : undefined;
    } else {
      return JSON.parse(input) as T;
    }
  },

  /**
   * Parse with error capture.
   *
   * Overload 1: `safeParse<T>(input)` → `{ ok: true; data: T | undefined } | { ok: false; error }`
   * Overload 2: `safeParse<T>(input, default)` → `{ ok: true; data: T } | { ok: false; error }`
   */
  safeParse<T>(...args: any[]) {
    const input = args[0] as JsonInput;
    const defaultValue = args[1] as t.JsonParseDefault<T>;

    const done = (data?: T, error?: t.StdError) => {
      type R = t.JsonParseResult<T>;
      const ok = !error;
      return Delete.undefined({ ok, data, error }) as R;
    };

    if (input == null) return done(wrangle.default(defaultValue));
    try {
      return done(Json.parse(input, defaultValue));
    } catch (err) {
      return done(undefined, Err.std(err));
    }
  },
} as const;

/**
 * Helpers:
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
