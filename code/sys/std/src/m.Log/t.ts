import type { t } from './common.ts';

/**
 * Log severity / output level.
 */
export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

/**
 * Tools for standardised console logging.
 */
export type LogLib = {
  /** The complete set of log levels in deterministic order. */
  readonly levels: readonly LogLevel[];

  /**
   * Create a category/timestamp prefixed logger function.
   *
   * Example:
   *   const log = Log.logger('Foobar');
   *   log('ready'); // → [Foobar] 20:34:36.200 ready
   *
   *   const sub = log.sub('Subpart');
   *   sub('connected'); // → [Foobar:Subpart] 20:34:36.200 connected
   */
  readonly logger: (category: string, options?: LogOptions) => Logger;
};

/**
 * A logger function: pass any values; implementation decides formatting.
 */
export type LoggerFn = (...args: readonly unknown[]) => void;

/**
 * Options for creating a category-based logger.
 */
export type LogOptions = {
  /** Dynamic enable/disable source (checked each call). Default: true. */
  readonly enabled?: t.ReadableSignal<boolean>;

  /** Console methodLogLevelwith. Default: 'info'. */
  readonly method?: LogLevel;

  /**
   * Time formatter for timestamp inclusion.
   * - Return a string to include timestamp.
   * - Return null (or set option to null) to omit timestamp entirely.
   * Default: `now.toISOString().slice(11, 23)` → "HH:MM:SS.mmm"
   */
  readonly timestamp?: ((now: Date) => string | null) | null;
};

/**
 * A logger is a callable function with a couple of small, composable utilities.
 *
 * - `category`: fully-qualified category this logger prefixes with.
 * - `sub(category, options?)`: derive a child logger with `category: "<parent>:<sub-category>"`.
 *   Child inherits parent's options; any provided options override for the child.
 */
export type Logger = LoggerFn & {
  readonly category: string;
  readonly sub: (category: string, options?: LogOptions) => Logger;
};
