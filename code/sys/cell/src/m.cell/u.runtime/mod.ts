import type { t } from './common.ts';
import { check } from './u.check.ts';
import { start } from './u.start.ts';

export const CellRuntime: t.Cell.Runtime.Lib = { check, start };
