import type { t } from './common.ts';

type P = t.StringPath;

export type CmdArgs = CmdArgsDev | CmdArgsBuild | CmdArgsServe | CmdArgsUpgrade;
export type CmdArgsDev = { cmd: 'dev'; inDir?: P; srcDir?: P; open?: boolean };
export type CmdArgsBuild = { cmd: 'build'; inDir?: P };
export type CmdArgsServe = { cmd: 'serve'; inDir?: P };
export type CmdArgsUpgrade = { cmd: 'upgrade'; inDir?: P; force?: boolean };
