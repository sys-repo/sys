import type { JsonParseDefault, JsonParseResult } from './t.ts';
import { type t, Err } from './common.ts';
import { parse as parseJsoncStd } from '@std/jsonc';

type JsonInput = string | undefined;
type JsonParseOptions = { jsonc?: boolean };

/**
 * Parse a JSON string (or return the default/undefined) - throws on invalid JSON.
 *
 * Overload 1: `parse<T>(input)` → `T | undefined`
 * Overload 2: `parse<T>(input, default)` → `T`
 */
export function parse<T>(input: JsonInput): T | undefined;
export function parse<T>(input: JsonInput, defaultValue: JsonParseDefault<T>): T;
export function parse<T>(
  input: JsonInput,
  defaultValue: JsonParseDefault<T>,
  options: JsonParseOptions,
): T;
export function parse<T>(
  input: JsonInput,
  defaultValue?: JsonParseDefault<T>,
  options?: JsonParseOptions,
): T | undefined {
  const opts = wrangle.options(defaultValue, options);
  const hasDefault = opts.hasDefault;
  const jsonc = opts.jsonc;

  // Treat `undefined` (or empty string) as "no value" → default / undefined.
  const hasNoInput =
    input === undefined || (typeof input === 'string' && input.trim().length === 0);

  if (hasNoInput) {
    if (!hasDefault) return undefined;
    return resolveDefault(opts.defaultValue) as T;
  }

  // NB: Throws on invalid JSON/JSONC.
  const result = jsonc ? parseJsoncStd(input) : JSON.parse(input);
  return result as T;
}

/**
 * Parse with error capture.
 *
 * Overload 1: `safeParse<T>(input)` → { ok: true; data: T | undefined } | { ok: false; error }
 * Overload 2: `safeParse<T>(input, default)` → { ok: true; data: T } | { ok: false; error }
 */
export function safeParse<T>(input: JsonInput): JsonParseResult<T | undefined>;
export function safeParse<T>(
  input: JsonInput,
  defaultValue: JsonParseDefault<T>,
): JsonParseResult<T>;
export function safeParse<T>(
  input: JsonInput,
  defaultValue: JsonParseDefault<T>,
  options: JsonParseOptions,
): JsonParseResult<T>;
export function safeParse<T>(
  input: JsonInput,
  defaultValue?: JsonParseDefault<T>,
  options?: JsonParseOptions,
): JsonParseResult<T | undefined> {
  try {
    // Delegate all "no input" + default handling to `parse`.
    const data = options
      ? parse<T>(input, defaultValue as JsonParseDefault<T>, options)
      : defaultValue === undefined
        ? parse<T>(input)
        : parse<T>(input, defaultValue as JsonParseDefault<T>);
    return { ok: true, data };
  } catch (cause: unknown) {
    const opts = wrangle.options(defaultValue, options);
    const format = opts.jsonc ? 'JSONC' : 'JSON';
    const error = Err.std(`Failed while parsing ${format}`, { cause });
    return {
      ok: false,
      data: undefined as T | undefined, // default is NOT applied on parse failure
      error,
    };
  }
}

/**
 * Resolve a default value which may be a literal or a thunk.
 */
const resolveDefault = (defaultValue: unknown) => {
  return typeof defaultValue === 'function' ? (defaultValue as () => unknown)() : defaultValue;
};

const wrangle = {
  options(defaultValue: unknown, options: unknown) {
    const o = wrangle.isOptions(options) ? options : undefined;
    return { jsonc: !!o?.jsonc, defaultValue, hasDefault: defaultValue !== undefined };
  },

  isOptions(input: unknown): input is { jsonc?: boolean } {
    if (typeof input !== 'object' || input === null) return false;
    return 'jsonc' in (input as Record<string, unknown>);
  },
} as const;
