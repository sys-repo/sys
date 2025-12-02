import { type t, Err } from './common.ts';

/**
 * Parse a JSON string (or return the default/undefined) - throws on invalid JSON.
 *
 * Overload 1: `parse<T>(input)` → `T | undefined`
 * Overload 2: `parse<T>(input, default)` → `T`
 */
export const parse: t.JsonLib['parse'] = (input, defaultValue?: unknown) => {
  // Treat `undefined` (or empty string) as "no value" → default / undefined.
  const hasNoInput =
    input === undefined || (typeof input === 'string' && input.trim().length === 0);

  if (hasNoInput) {
    if (defaultValue === undefined) return undefined as any;
    return resolveDefault(defaultValue) as any;
  }

  // NB: Throws on invalid JSON.
  return JSON.parse(input);
};

/**
 * Parse with error capture.
 *
 * Overload 1: `safeParse<T>(input)` → { ok: true; data: T | undefined } | { ok: false; error }
 * Overload 2: `safeParse<T>(input, default)` → { ok: true; data: T } | { ok: false; error }
 */
export const safeParse: t.JsonLib['safeParse'] = (input, defaultValue?: unknown) => {
  try {
    // Delegate all "no input" + default handling to `parse`.
    const data = parse(input, defaultValue as any);
    return { ok: true, data };
  } catch (cause: any) {
    const error = Err.std('Failed while parsing JSON', { cause });
    return {
      ok: false,
      data: undefined as any, // default is NOT applied on parse failure
      error,
    };
  }
};

/**
 * Resolve a default value which may be a literal or a thunk.
 */
const resolveDefault = (defaultValue: unknown) => {
  return typeof defaultValue === 'function' ? (defaultValue as () => unknown)() : defaultValue;
};
