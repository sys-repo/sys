import { type t, Is } from './common.ts';

type O = Record<string, unknown>;

/**
 * Convert one or more properties on the given object into accessor
 * (getter-backed) properties that return their existing values.
 *
 * This is primarily useful for development ergonomics, allowing heavy
 * fields to be hidden behind getters so that console inspection does
 * not eagerly expand large nested structures.
 *
 * - When `keys` is omitted or `null`, all own enumerable keys are wrapped.
 * - When a single key or list of keys is provided, only those are wrapped.
 */
export const asGetter: t.ObjLib['asGetter'] = (
  obj: O,
  keysOrOptions?: unknown,
  maybeOptions?: t.ObjAsGetterOptions,
) => {
  if (!Is.record(obj) || Array.isArray(obj)) return obj;

  // Wrangle parameters:
  const hasKeys = Is.array(keysOrOptions) || Is.str(keysOrOptions) || keysOrOptions === null;
  const keys = hasKeys ? keysOrOptions : undefined;
  const options = hasKeys ? maybeOptions : (keysOrOptions as t.ObjAsGetterOptions | undefined);
  const { enumerable = true, configurable = true } = options ?? {};

  // Transform the object:
  const list: readonly string[] =
    keys == null
      ? Object.keys(obj)
      : Array.isArray(keys)
        ? (keys as readonly string[])
        : [keys as string];

  for (const key of list) {
    const value = obj[key];
    Object.defineProperty(obj, key, {
      get: () => value,
      enumerable,
      configurable,
    });
  }

  return obj;
};
