import type { t } from './common.ts';
import { Delta } from './m.Delta.ts';
import { Fmt } from './m.Fmt.ts';
import { apply } from './u/u.apply.ts';
import { Args } from './u/u.args.ts';
import { collect } from './u/u.collect.ts';
import { plan } from './u/u.plan.ts';
import { run } from './u/u.run.ts';

export const WorkspaceBump: t.WorkspaceBump.Lib = {
  Args,
  Fmt,
  Delta,
  collect,
  plan,
  apply,
  run,
};
