import type { t } from './common.ts';
import { Fmt } from './m.Fmt.ts';
import { apply } from './u.apply.ts';
import { Args } from './u.args.ts';
import { collect } from './u.collect.ts';
import { plan } from './u.plan.ts';
import { run } from './u.run.ts';

export const WorkspaceBump: t.WorkspaceBump.Lib = {
  Args,
  Fmt,
  collect,
  plan,
  apply,
  run,
};
