import { type t, Signal } from './common.ts';

/**
 * Create a logger bound to a category/name.
 * - Stable prefix: "[Category[:Sub]] HH:MM:SS.mmm"
 * - No styling in std; higher layers can add color if needed.
 * - Supports currying via `.make(sub, options?)`.
 */
export const make: t.LogLib['make'] = (category, options) => {
  const parentOptions = options ?? {};

  const create = (cat: string, opts?: t.LogOptions): t.Logger => {
    const merged: t.LogOptions = {
      ...parentOptions,
      ...opts,
      enabled: combineEnabled(parentOptions.enabled, opts?.enabled),
    };

    const method: t.LogMethod = merged.method ?? 'info';
    const formatTime = merged.formatTime ?? defaultFormatTime;

    const fn: t.LoggerFn = (...args: readonly unknown[]) => {
      const enabled = Signal.read(merged.enabled);
      if (enabled === false) return;
      const time = formatTime(new Date());
      const emit = getConsoleMethod(method);
      emit(`[${cat}] ${time}`, ...args);
    };

    const logger: t.Logger = Object.assign(fn, {
      category: cat,
      make: (subCategory: string, childOpts?: t.LogOptions) =>
        create(`${cat}:${subCategory}`, childOpts),
    });

    return logger;
  };

  return create(category, options);
};

/**
 * Helpers:
 */
function defaultFormatTime(now: Date): string {
  return now.toISOString().slice(11, 23);
}

function getConsoleMethod(method: t.LogMethod) {
  const candidate = (console as unknown as Record<string, unknown>)[method];
  return typeof candidate === 'function'
    ? (candidate as (...a: unknown[]) => void).bind(console)
    : console.log.bind(console);
}

/**
 * Combine two ReadableSignal<boolean> with logical AND.
 */
function combineEnabled(
  a?: t.ReadableSignal<boolean>,
  b?: t.ReadableSignal<boolean>,
): t.ReadableSignal<boolean> | undefined {
  // Only treat "undefined" as absent; boolean false is a valid, intentional OFF.
  if (a === undefined) return b;
  if (b === undefined) return a;
  return () => Boolean(Signal.read(a)) && Boolean(Signal.read(b));
}
