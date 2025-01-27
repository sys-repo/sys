import type { t } from './common.ts';

type P = t.StringPath;

/**
 * The API invoked via the CLI command API.
 */
export type ViteEntryLib = {
  /** Main entry: [argv] "cmd" parse and delegate.  */
  main(argv?: string[] | t.ViteEntryArgs): Promise<void>;

  /** Start the HMR `dev` server. */
  dev(args: t.ViteEntryArgsDev): Promise<void>;

  /** Build the production `dist` bundle. */
  build(args: t.ViteEntryArgsBuild): Promise<void>;

  /** Start the HTTP static server on the bundled `dist/*` folder. */
  serve(args: t.ViteEntryArgsServe): Promise<void>;
};

/**
 * ARGV (Command Line Arguments)
 */
export type ViteEntryArgs =
  | ViteEntryArgsInit
  | ViteEntryArgsDev
  | ViteEntryArgsBuild
  | ViteEntryArgsServe;

/** The `init` command. */
export type ViteEntryArgsInit = { cmd: 'init'; in?: P; silent?: boolean };

/** The HMR `dev` server. */
export type ViteEntryArgsDev = { cmd: 'dev'; in?: P; open?: boolean };

/** The `build` project command. */
export type ViteEntryArgsBuild = {
  cmd: 'build';
  in?: P;
  out?: P;
  silent?: boolean;
};

/** The `serve` the built project `/dist` folder command. */
export type ViteEntryArgsServe = { cmd: 'serve'; port?: number; dir?: P; silent?: boolean };
