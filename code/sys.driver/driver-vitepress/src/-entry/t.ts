import type { t } from './common.ts';

type P = t.StringPath;

/**
 * The API invoked via the CLI command API.
 */
export type VitePressEntryLib = {
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
export type VitePressEntryArgs =
  | EntryArgsInit
  | EntryArgsDev
  | EntryArgsBuild
  | EntryArgsServe
  | EntryArgsClean
  | EntryArgsUpgrade
  | EntryArgsBackup
  | EntryArgsHelp;

/** The `init` command. */
export type EntryArgsInit = { cmd: 'init'; inDir?: P };

/** The `dev` server command. */
export type EntryArgsDev = { cmd: 'dev'; inDir?: P; srcDir?: P; open?: boolean };

/** The `build` project command. */
export type EntryArgsBuild = { cmd: 'build'; inDir?: P };

/** The `serve` built project command. */
export type EntryArgsServe = { cmd: 'serve'; inDir?: P };

/** The `upgrade` command. */
export type EntryArgsUpgrade = {
  cmd: 'upgrade';
  inDir?: P;
  force?: boolean;
  version?: t.StringSemver;
};

/** The `clean` command. */
export type EntryArgsClean = { cmd: 'clean'; inDir?: P };

/** The `backup` command. */
export type EntryArgsBackup = { cmd: 'backup'; inDir?: P; includeDist?: boolean; force?: boolean };

/** The `help` information command. */
export type EntryArgsHelp = { cmd: 'help'; inDir?: P };
