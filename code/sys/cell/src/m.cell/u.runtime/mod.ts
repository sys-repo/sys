import type { t } from './common.ts';
import { start } from './u.start.ts';
import { verify } from './u.verify.ts';
import { wait } from './u.wait.ts';

export const CellRuntime: t.Cell.Runtime.Lib = { verify, start, wait };
