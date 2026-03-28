import { type t } from './common.ts';
import { build } from './m.plan.ts';

/**
 * @module
 * Pure topological dependency upgrade planning.
 */
export const Topological: t.EsmTopological.Lib = {
  build,
};
