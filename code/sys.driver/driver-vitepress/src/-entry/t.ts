import type { t } from './common.ts';

type P = t.StringPath;

/**
 * The API invoked via the CLI command API.
 */
export type VitePressMainLib = {
  /**
   * Scaffold a new project, use the command-line:
   *
   *      deno run -A jsr:@sys/driver-vitepress/init
   */
  init(argv: string[], options?: { silent?: boolean }): Promise<void>;

  /**
   * Main command entry point.
   *
   * Pass: "--cmd=<sub-command>"
   *      to specify which action to take, and then the paratmers
   *      that pertain to <sub-command> as defined in the <VitePressCmd> type.
   */
  main(argv: string[]): Promise<void>;
};

/**
 * Arguments passed into the main CLI entry point.
 */
export type VitePressMainArgs =
  | MainArgsInit
  | MainArgsDev
  | MainArgsBuild
  | MainArgsServe
  | MainArgsClean
  | MainArgsUpgrade
  | MainArgsBackup
  | MainArgsHelp;

/** The `init` command. */
export type MainArgsInit = { cmd: 'init'; inDir?: P };

/** The `dev` server command. */
export type MainArgsDev = { cmd: 'dev'; inDir?: P; srcDir?: P; open?: boolean };

/** The `build` project command. */
export type MainArgsBuild = { cmd: 'build'; inDir?: P };

/** The `serve` built project command. */
export type MainArgsServe = { cmd: 'serve'; inDir?: P };

/** The `upgrade` command. */
export type MainArgsUpgrade = {
  cmd: 'upgrade';
  inDir?: P;
  force?: boolean;
  version?: t.StringSemver;
};

/** The `clean` command. */
export type MainArgsClean = { cmd: 'clean'; inDir?: P };

/** The `backup` command. */
export type MainArgsBackup = { cmd: 'backup'; inDir?: P; includeDist?: boolean; force?: boolean };

/** The `help` information command. */
export type MainArgsHelp = { cmd: 'help'; inDir?: P };
