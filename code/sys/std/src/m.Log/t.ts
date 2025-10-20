import type { t } from './common.ts';

/**
 * Tools for standardised console logging.
 */
export type LogLib = {
  /**
   * Create a logger bound to a category/name.
   * Example:
   *   const logA = Log.make('Media.Devices');
   *   logA('hello'); // → [Media.Devices] 20:34:36.200 hello
   *
   *   const logB = logA.make('Sub-Category');
   *   logB('hello'); // → [Media.Devices:Sub-Category] 20:34:36.200 hello
   */
  readonly make: (category: string, options?: LogOptions) => Logger;
};

/**
 * A logger function: pass any values; implementation decides formatting.
 */
export type LoggerFn = (...args: readonly unknown[]) => void;

/**
 * Union for opt-in muting without globals.
 * - boolean: fixed on/off
 * - () => boolean: callback checked at call-time
 * - { value: boolean }: "signal-like" (eg. Preact Signal, Ref, etc.)
 */
export type LogEnabled = t.ReadableSignal<boolean>;

/** Console method to use; defaults to 'info'. */
export type LogMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

/**
 * Options for creating a namespaced logger.
 */
export type LogOptions = {
  /** Dynamic enable/disable source (checked each call). Default: true. */
  readonly enabled?: LogEnabled;
  /** Console method to emit with. Default: 'info'. */
  readonly method?: LogMethod;
  /**
   * Optional time formatter. Receives "now" and must return the display string.
   * Default: HH:MM:SS.mmm (ISO time slice).
   */
  readonly formatTime?: (now: Date) => string;
};

/**
 * A logger is a callable function with a couple of small, composable utilities.
 *
 * - `category`: fully-qualified category this logger prefixes with.
 * - `make(sub, options?)`: derive a child logger with `category: "<parent>:<sub>"`.
 *   Child inherits parent's options; any provided options override for the child.
 */
export type Logger = LoggerFn & {
  readonly category: string;
  readonly make: (subCategory: string, options?: LogOptions) => Logger;
};
