import { type t } from './common.ts';
import { Is } from './m.Is.ts';

export const toObject: t.SignalLib['toObject'] = <T>(
  input: T,
  opts: t.SignalToObjectOptions = {},
): t.UnwrapSignals<T> => {
  const { depth = 5, includeGetters = false } = opts;
  const seen = new WeakSet<object>();

  const visit = (value: unknown, d: number): unknown => {
    if (d < 0) return '[max-depth]';
    if (value === null || typeof value !== 'object') {
      return toSafeValue(value, visit, d);
    }

    // Signals first (already handled above when non-object)
    if (Is.signal(value)) return (value as any).value;

    // Cycle guard
    if (seen.has(value as object)) return '[circular]';
    seen.add(value as object);

    // Arrays / Map / Set (handled without touching getters)
    if (Array.isArray(value) || value instanceof Map || value instanceof Set) {
      return toSafeValue(value, visit, d);
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

const isIterable = (v: unknown): v is Iterable<unknown> =>
  v != null && typeof (v as any)[Symbol.iterator] === 'function';

const toSafeValue = <T>(value: T, visit: (x: unknown, d: number) => unknown, depth: number) => {
  if (Is.signal(value)) return (value as any).value;
  if (Array.isArray(value)) return (value as unknown[]).map((x) => visit(x, depth - 1));
  if (value instanceof Map)
    return Array.from((value as Map<unknown, unknown>).entries()).map(([k, v]) => [
      visit(k, depth - 1),
      visit(v, depth - 1),
    ]);
  if (value instanceof Set)
    return Array.from(value as Set<unknown>).map((x) => visit(x, depth - 1));
  if (typeof value === 'function') return '[function]';
  if (typeof value === 'symbol') return String(value);
  return value as unknown;
};
