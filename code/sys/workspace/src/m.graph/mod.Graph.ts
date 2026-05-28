import type { t } from './common.ts';
import { Snapshot } from './m.snapshot/mod.ts';
import { collect } from './u/u.collect.ts';
import { order } from './u/u.order.ts';
import { packageEdges } from './u/u.packageEdges.ts';

/**
 * Local workspace graph helper library.
 */
export const WorkspaceGraph: t.WorkspaceGraph.Lib = {
  Snapshot,
  collect,
  packageEdges,
  order,
};
