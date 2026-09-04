import type { t } from './common.ts';
import { Fmt } from './m.Fmt.ts';
import { apply } from './u/u.apply.ts';
import { Args } from './u/u.args.ts';
import { collect } from './u/u.collect.ts';
import { plan } from './u/u.plan.ts';
import { run } from './u/u.run.ts';

/**
 * Package version bump helpers for collect, plan, apply, and run flows.
 */
export const WorkspaceBump: t.WorkspaceBump.Lib = Object.freeze({
  Args,
  Fmt,
  collect,
  plan,
  apply,
  run,
});
