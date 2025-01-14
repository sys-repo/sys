import type { t } from './common.ts';

type P = t.StringPath;

/**
 * The API invoked via the CLI command API for the Pkg.
 */
export type VitePressCmdLib = {
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
export type VitePressCmdArgs = CmdArgs;
export type CmdArgs = CmdArgsMain | CmdArgsInit;
export type CmdArgsMain =
  | CmdArgsDev
  | CmdArgsBuild
  | CmdArgsServe
  | CmdArgsClean
  | CmdArgsUpgrade
  | CmdArgsBackup
  | CmdArgsHelp;

/** The `init` command. */
export type CmdArgsInit = { inDir?: P };

/** The `dev` server command. */
export type CmdArgsDev = { cmd: 'dev'; inDir?: P; srcDir?: P; open?: boolean };

/** The `build` project command. */
export type CmdArgsBuild = { cmd: 'build'; inDir?: P };

/** The `serve` built project command. */
export type CmdArgsServe = { cmd: 'serve'; inDir?: P };

/** The `upgrade` command. */
export type CmdArgsUpgrade = {
  cmd: 'upgrade';
  inDir?: P;
  force?: boolean;
  version?: t.StringSemver;
};

/** The `clean` command. */
export type CmdArgsClean = { cmd: 'clean'; inDir?: P };

/** The `backup` command. */
export type CmdArgsBackup = { cmd: 'backup'; inDir?: P; includeDist?: boolean; force?: boolean };

/** The `help` information command. */
export type CmdArgsHelp = { cmd: 'help'; inDir?: P };
