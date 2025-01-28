import type { t } from './common.ts';

/**
 * The API invoked via the CLI command API.
 */
export type HttpEntryLib = {
  /** Main entry: [argv] "cmd" parse and delegate.  */
  entry(argv?: string[] | t.HttpEntryArgs): Promise<void>;

  /** Start the HTTP server. */
  start(args: t.HttpEntryArgsStart): Promise<void>;
};

/**
 * ARGV (Command Line Arguments)
 */
export type HttpEntryArgs = HttpEntryArgsStart;

/** Start an HTTP server */
export type HttpEntryArgsStart = {
  cmd: 'start';
  port?: number;
  dir?: t.StringDir;
};
