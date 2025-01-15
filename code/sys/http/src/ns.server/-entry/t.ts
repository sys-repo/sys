import type { t } from './common.ts';

/**
 * The API invoked via the CLI command API.
 */
export type HttpMainLib = {
  /** Main entry: [argv] "cmd" parse and delegate.  */
  entry(argv?: string[]): Promise<void>;

  /** Start the HTTP server. */
  start(args: t.HttpMainArgsStart): Promise<void>;
};

/**
 * ARGV (Command Line Arguments)
 */
export type HttpMainArgs = HttpMainArgsStart;

/** Start an HTTP server */
export type HttpMainArgsStart = {
  cmd: 'start';
  port?: number;
};
