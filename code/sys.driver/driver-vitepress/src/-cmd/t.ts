import type { t } from './common.ts';

type P = t.StringPath;

/**
 * Arguments passed into the main CLI entry point.
 */
export type CmdArgs = CmdArgsDev | CmdArgsBuild | CmdArgsServe | CmdArgsUpgrade;

/** The `dev` server command. */
export type CmdArgsDev = { cmd: 'dev'; inDir?: P; srcDir?: P; open?: boolean };

/** The `build` project command. */
export type CmdArgsBuild = { cmd: 'build'; inDir?: P };

/** The `serve` built project command. */
export type CmdArgsServe = { cmd: 'serve'; inDir?: P };

/** The `upgrade` command. */
export type CmdArgsUpgrade = { cmd: 'upgrade'; inDir?: P; force?: boolean };
