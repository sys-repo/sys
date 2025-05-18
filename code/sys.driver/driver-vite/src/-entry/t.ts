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
  | ViteEntryArgsClean
  | ViteEntryArgsDev
  | ViteEntryArgsBuild
  | ViteEntryArgsServe
  | ViteEntryArgsUpgrade
  | ViteEntryArgsBackup
  | ViteEntryArgsHelp;

/** The `init` command. */
export type ViteEntryArgsInit = {
  cmd: 'init';
  dir?: P;
  silent?: boolean;
  tmpl?: t.ViteTmplKind | boolean;
};

/** The `clean` command. */
export type ViteEntryArgsClean = { cmd: 'clean'; dir?: P };

/** The HMR `dev` server. */
export type ViteEntryArgsDev = { cmd: 'dev'; dir?: P; entry?: P; open?: boolean };

/** The `build` project command. */
export type ViteEntryArgsBuild = { cmd: 'build'; dir?: P; silent?: boolean };

/** The `serve` the built project `/dist` folder command. */
export type ViteEntryArgsServe = { cmd: 'serve'; port?: number; dir?: P; silent?: boolean };

/** The `upgrade` command. */
export type ViteEntryArgsUpgrade = {
  cmd: 'upgrade';
  dir?: P;
  force?: boolean;
  version?: t.StringSemver;
  dryRun?: boolean;
};

/** The `backup` command. */
export type ViteEntryArgsBackup = {
  cmd: 'backup';
  dir?: P;
  force?: boolean;
  includeDist?: boolean;
};

/** The `help` information command. */
export type ViteEntryArgsHelp = { cmd: 'help'; dir?: P; info?: boolean };
