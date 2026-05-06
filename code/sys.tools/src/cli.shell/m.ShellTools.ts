import { type t } from './common.ts';
import { cli } from './m.cli.ts';
import { doctor } from './u.doctor.ts';

export const ShellTools: t.ShellToolsLib = { cli, doctor };
