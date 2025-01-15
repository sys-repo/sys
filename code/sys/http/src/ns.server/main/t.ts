import type { t } from './common.ts';

/**
 * The API invoked via the CLI command API.
 */
export type HttpMainLib = {
  /** Main entry: [argv] "cmd" parse and delegate.  */
  entry(argv?: string[]): Promise<void>;

  /** Start the HTTP server. */
  start(args: t.HttpMainStartArgs): Promise<void>;
};

/**
 * ARGV (Command Line Arguments)
 */
export type HttpMainArgs = HttpMainStartArgs;

/** Start an HTTP server */
export type HttpMainStartArgs = {
  cmd: 'start';
  port?: number;
};
