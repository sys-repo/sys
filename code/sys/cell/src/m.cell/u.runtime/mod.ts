import type { t } from './common.ts';
import { start } from './u.start.ts';
import { verify } from './u.verify.ts';

export const CellRuntime: t.Cell.Runtime.Lib = { verify, start };
