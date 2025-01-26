import type { t } from './common.ts';

type P = t.StringPath;

/**
 * The API invoked via the CLI command API.
 */
export type VitepressEntryLib = {
  /**
   * Main command entry point.
   *
   * Pass: "--cmd=<sub-command>"
   *      to specify which action to take, and then the paratmers
   *      that pertain to <sub-command> as defined in the <VitePressCmd> type.
   */
  main(argv?: string[] | VitepressEntryArgs): Promise<void>;
};

/**
 * Arguments passed into the main CLI entry point.
 */
export type VitepressEntryArgs =
  | VitepressEntryArgsInit
  | VitepressEntryArgsDev
  | VitepressEntryArgsBuild
  | VitepressEntryArgsServe
  | VitepressEntryArgsClean
  | VitepressEntryArgsUpgrade
  | VitepressEntryArgsBackup
  | VitepressEntryArgsHelp;

/** The `init` command. */
export type VitepressEntryArgsInit = { cmd: 'init'; inDir?: P; silent?: boolean };

/** The `dev` server command. */
export type VitepressEntryArgsDev = { cmd: 'dev'; inDir?: P; srcDir?: P; open?: boolean };

/** The `build` project command. */
export type VitepressEntryArgsBuild = { cmd: 'build'; inDir?: P };

/** The `serve` the built project `/dist` folder command. */
export type VitepressEntryArgsServe = { cmd: 'serve'; inDir?: P };

/** The `upgrade` command. */
export type VitepressEntryArgsUpgrade = {
  cmd: 'upgrade';
  inDir?: P;
  force?: boolean;
  version?: t.StringSemver;
};

/** The `clean` command. */
export type VitepressEntryArgsClean = { cmd: 'clean'; inDir?: P };

/** The `backup` command. */
export type VitepressEntryArgsBackup = {
  cmd: 'backup';
  inDir?: P;
  includeDist?: boolean;
  force?: boolean;
};

/** The `help` information command. */
export type VitepressEntryArgsHelp = { cmd: 'help'; inDir?: P };
