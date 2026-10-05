import type { t } from './common.ts';
import { Linear } from './m.Plan.u.linear.ts';
import { resolve } from './m.Plan.u.resolve.ts';
import { validate } from './m.Plan.u.validate.ts';

export const Plan: t.PlanLib = {
  Linear,
  validate,
  resolve,
};
