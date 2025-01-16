import type { t } from './common.ts';

type P = t.StringPath;

/**
 * The API invoked via the CLI command API.
 */
export type ViteEntryLib = {
  /** Main entry: [argv] "cmd" parse and delegate.  */
  entry(argv?: string[] | t.ViteEntryArgs): Promise<void>;

  /** Start the HTTP static server on the bundled `dist/*` folder. */
  serve(args: t.EntryArgsServe): Promise<void>;

  /** The HMR `dev` server. */
  dev(args: t.EntryArgsDev): Promise<void>;
};

/**
 * ARGV (Command Line Arguments)
 */
export type ViteEntryArgs = EntryArgsDev | EntryArgsServe;

/** The HMR `dev` server. */
export type EntryArgsDev = { cmd: 'dev'; input?: P; open?: boolean };

/** The `serve` the built project `/dist` folder command. */
export type EntryArgsServe = { cmd: 'serve'; port?: number; dir?: P };
