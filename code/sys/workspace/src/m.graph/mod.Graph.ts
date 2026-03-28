import type { t } from './common.ts';
import { Snapshot } from './m.snapshot/mod.ts';
import { collect } from './u.collect.ts';
import { order } from './u.order.ts';
import { packageEdges } from './u.packageEdges.ts';

/**
 * Local workspace graph helper library.
 */
export const WorkspaceGraph: t.WorkspaceGraph.Lib = {
  Snapshot,
  collect,
  packageEdges,
  order,
};
