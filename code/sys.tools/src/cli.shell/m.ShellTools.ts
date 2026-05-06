import { type t } from './common.ts';
import { cli } from './m.cli.ts';
import { Alias } from './u.alias.ts';
import { doctor } from './u.doctor.ts';

export const ShellTools: t.ShellTool.Lib = { cli, doctor, Alias };
