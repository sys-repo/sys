import { type t, Is, Signal } from './common.ts';

/**
 * Create a category-based logger.
 * - Prefix: "[Category[:Sub]]" plus optional timestamp.
 * - Timestamp: controlled by `formatTime`; default HH:MM:SS.mmm; set to null to omit.
 * - Enabled: `enabled?: t.ReadableSignal<boolean>` (defaults to true). Parent AND child are combined.
 * - Browser styling: when `Is.browser()` is true, the prefix uses `%c` with a subtle CSS accent.
 */
export const makeLogger: t.LogLib['logger'] = (category, options) => {
  const parent = options ?? {};

  function create(cat: string, child?: t.LogOptions): t.Logger {
    const merged: t.LogOptions = {
      ...parent,
      ...child,
      enabled: combineEnabled(parent.enabled, child?.enabled),
    };

    const method: t.LogLevel = merged.method ?? 'info';
    const emit = getConsoleMethod(method);
    const fmt = merged.timestamp === undefined ? defaultTimeFormatter : merged.timestamp;

    const useCss = Is.browser();
    const css = 'color:#0af;font-weight:bold;';

    const loggerFn: t.LoggerFn = (...args: readonly unknown[]) => {
      if (Signal.read(merged.enabled) === false) return;

      const now = new Date();
      const ts = fmt === null ? null : fmt(now);
      const prefix = ts ? `[${cat}] ${ts}` : `[${cat}]`;

      if (useCss) emit(`%c${prefix}`, css, ...args);
      else emit(prefix, ...args);
    };

    const logger: t.Logger = Object.assign(loggerFn, {
      category: cat,
      sub(subCategory: string, subOpts?: t.LogOptions) {
        return create(`${cat}:${subCategory}`, subOpts);
      },
    });

    return logger;
  }

  return create(category, options);
};

/**
 * Helpers:
 */
function defaultTimeFormatter(now: Date): string {
  return now.toISOString().slice(11, 23);
}

function getConsoleMethod(method: t.LogLevel) {
  const candidate = (console as unknown as Record<string, unknown>)[method];
  return typeof candidate === 'function'
    ? (candidate as (...a: unknown[]) => void).bind(console)
    : console.log.bind(console);
}

function combineEnabled(
  a?: t.ReadableSignal<boolean>,
  b?: t.ReadableSignal<boolean>,
): t.ReadableSignal<boolean> | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return () => Boolean(Signal.read(a)) && Boolean(Signal.read(b));
}
