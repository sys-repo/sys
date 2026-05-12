import type { t } from './common.ts';
import { run } from './u.run.ts';
import { verify } from './u.verify.ts';

export const CellAction: t.Cell.Action.Lib = { verify, run };
