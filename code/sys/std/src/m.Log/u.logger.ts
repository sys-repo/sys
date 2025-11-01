import { type t, D, Is, Signal } from './common.ts';
import { cleanHexColor } from './u.ts';

/**
 * Create a category-based logger.
 * - Prefix: "[Category[:Sub]]" plus optional timestamp.
 * - Timestamp: controlled by `formatTime`; default HH:MM:SS.mmm; set to null to omit.
 * - Enabled: `enabled?: t.ReadableSignal<boolean>` (defaults to true). Parent AND child are combined.
 * - Browser styling: when `Is.browser()` is true, the prefix uses `%c` with a subtle CSS accent.
 */
export const makeLogger: t.LogLib['logger'] = (category, opts = {}) => {
  const parentOpts = opts ?? {};

  function create(cat: string, childOpts: t.LogOptions = {}): t.Logger {
    const opts: t.LogOptions = {
      ...parentOpts,
      ...childOpts,
      enabled: combineEnabled(parentOpts.enabled, childOpts.enabled),
      prefixColor: childOpts.prefixColor ?? parentOpts.prefixColor,
    };

    const method: t.LogLevel = opts.method ?? 'info';
    const emit = getConsoleMethod(method);
    const fmt = opts.timestamp === undefined ? defaultTimeFormatter : opts.timestamp;

    const useCss = Is.browser();
    const prefixColor = cleanHexColor(opts.prefixColor ?? D.prefixColor);
    const css = `color:${prefixColor};font-weight:bold;`;

    const loggerFn: t.LoggerFn = (...args: readonly unknown[]) => {
      if (Signal.read(opts.enabled) === false) return;

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

  return create(category, parentOpts);
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
