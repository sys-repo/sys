import { type t } from './common.ts';
import { cli } from './m.cli.ts';
import { Alias } from './u.alias.ts';
import { apply } from './u.apply.ts';
import { doctor } from './u.doctor.ts';
import { Path } from './u.path.ts';

export const ShellTools: t.ShellTool.Lib = { cli, doctor, apply, Alias, Path };
