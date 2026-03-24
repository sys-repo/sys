import { type t } from './common.ts';
import { collect } from './u.collect.ts';
import { order } from './u.order.ts';
import { packageEdges } from './u.packageEdges.ts';

/** Local workspace graph helper library. */
export const WorkspaceGraph: t.WorkspaceGraph.Lib = {
  collect,
  packageEdges,
  order,
};
