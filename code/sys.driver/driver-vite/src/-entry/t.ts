import type { t } from './common.ts';

/**
 * The API invoked via the CLI command API.
 */
export type ViteEntryLib = {
  /** Main entry: [argv] "cmd" parse and delegate.  */
  entry(argv?: string[] | t.ViteEntryArgs): Promise<void>;

  /** Start the HTTP static server on the bundled `dist/*` folder. */
  serve(args: t.ViteEntryArgsServe): Promise<void>;
};

/**
 * ARGV (Command Line Arguments)
 */
export type ViteEntryArgs = ViteEntryArgsServe;

/** Start an HTTP server */
export type ViteEntryArgsServe = {
  cmd: 'serve';
  port?: number;
  dir?: t.StringDir;
};
