import type { t } from './common.ts';
import { plan } from './u.plan.ts';
import { run } from './u.run.ts';
import { verify } from './u.verify.ts';

export const CellTask: t.Cell.Task.Lib = Object.freeze({
  plan,
  verify,
  run,
});
