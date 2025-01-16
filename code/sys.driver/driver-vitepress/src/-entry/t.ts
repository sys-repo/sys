import type { t } from './common.ts';

type P = t.StringPath;

/**
 * The API invoked via the CLI command API.
 */
export type VitePressEntryLib = {
  /**
   * Main command entry point.
   *
   * Pass: "--cmd=<sub-command>"
   *      to specify which action to take, and then the paratmers
   *      that pertain to <sub-command> as defined in the <VitePressCmd> type.
   */
  main(argv?: string[] | VitePressEntryArgs): Promise<void>;
};

/**
 * Arguments passed into the main CLI entry point.
 */
export type VitePressEntryArgs =
  | VitePressEntryArgsInit
  | VitePressEntryArgsDev
  | VitePressEntryArgsBuild
  | VitePressEntryArgsServe
  | VitePressEntryArgsClean
  | VitePressEntryArgsUpgrade
  | VitePressEntryArgsBackup
  | VitePressEntryArgsHelp;

/** The `init` command. */
export type VitePressEntryArgsInit = { cmd: 'init'; inDir?: P; silent?: boolean };

/** The `dev` server command. */
export type VitePressEntryArgsDev = { cmd: 'dev'; inDir?: P; srcDir?: P; open?: boolean };

/** The `build` project command. */
export type VitePressEntryArgsBuild = { cmd: 'build'; inDir?: P };

/** The `serve` the built project `/dist` folder command. */
export type VitePressEntryArgsServe = { cmd: 'serve'; inDir?: P };

/** The `upgrade` command. */
export type VitePressEntryArgsUpgrade = {
  cmd: 'upgrade';
  inDir?: P;
  force?: boolean;
  version?: t.StringSemver;
};

/** The `clean` command. */
export type VitePressEntryArgsClean = { cmd: 'clean'; inDir?: P };

/** The `backup` command. */
export type VitePressEntryArgsBackup = {
  cmd: 'backup';
  inDir?: P;
  includeDist?: boolean;
  force?: boolean;
};

/** The `help` information command. */
export type VitePressEntryArgsHelp = { cmd: 'help'; inDir?: P };
