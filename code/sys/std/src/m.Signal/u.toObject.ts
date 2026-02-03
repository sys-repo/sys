import { type t, isPlainObject } from './common.ts';
import { Is } from './m.Is.ts';

export const toObject: t.SignalLib['toObject'] = <T>(
  input: T,
  opts: t.SignalToObjectOptions = {},
): t.UnwrapSignals<T> => {
  const { depth = 5, includeGetters = false } = opts;
  const func =
    opts.func === true
      ? 'include'
      : opts.func === false
        ? 'strip'
        : opts.func ?? 'stringify';
  const seen = new WeakSet<object>();

  const visit = (value: unknown, d: number): unknown => {
    if (d < 0) return '[max-depth]';
    if (value === null || typeof value !== 'object') {
      return toSafeValue(value, visit, d, func);
    }

    // Signals first (already handled above when non-object)
    if (Is.signal(value)) return (value as any).value;

    // Cycle guard
    if (seen.has(value as object)) return '[circular]';
    seen.add(value as object);

    // Arrays / Map / Set (handled without touching getters)
    if (Array.isArray(value) || value instanceof Map || value instanceof Set) {
      return toSafeValue(value, visit, d, func);
    }

    // Only traverse *plain* objects to avoid class instances/handles.
    if (!isPlainObject(value)) return '[object]';

    // Walk only data properties; skip accessors unless explicitly enabled.
    const out: Record<string | number | symbol, unknown> = {};
    const descs = Object.getOwnPropertyDescriptors(value);
    for (const key of Reflect.ownKeys(descs)) {
      const desc = descs[key as keyof typeof descs];
      if (!desc) continue;

      if (!includeGetters && (desc.get || desc.set)) {
        // Avoid invoking getters (common source of re-entrancy).
        continue;
      }

      if ('value' in desc) {
        if (func === 'strip' && typeof desc.value === 'function') {
          continue;
        }
        out[key] = visit(desc.value, d - 1);
      } else if (includeGetters && desc.get) {
        try {
          out[key] = visit((desc.get as () => unknown).call(value), d - 1);
        } catch {
          out[key] = '[unavailable]';
        }
      }
    }
    return out;
  };

  return visit(input, depth) as t.UnwrapSignals<T>;
};

/**
 * Helpers:
 */
const toSafeValue = <T>(
  value: T,
  visit: (x: unknown, d: number) => unknown,
  depth: number,
  func: 'strip' | 'include' | 'stringify',
) => {
  type S = Set<unknown>;
  type M = Map<unknown, unknown>;

  if (Is.signal(value)) return (value as any).value;
  if (Array.isArray(value)) {
    const items = (value as unknown[])
      .filter((x) => func !== 'strip' || typeof x !== 'function')
      .map((x) => visit(x, depth - 1));
    return items;
  }
  if (value instanceof Map) {
    return Array.from((value as M).entries())
      .filter(([k, v]) =>
        func === 'strip' ? typeof k !== 'function' && typeof v !== 'function' : true,
      )
      .map(([k, v]) => [visit(k, depth - 1), visit(v, depth - 1)]);
  }

  if (value instanceof Set) {
    return Array.from(value as S)
      .filter((x) => func !== 'strip' || typeof x !== 'function')
      .map((x) => visit(x, depth - 1));
  }
  if (typeof value === 'function') {
    if (func === 'include') return value;
    if (func === 'stringify') return '[function]';
    return undefined;
  }
  if (typeof value === 'symbol') return String(value);
  return value as unknown;
};
