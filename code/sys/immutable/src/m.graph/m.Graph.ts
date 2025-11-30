import type { t } from './common.ts';
import { walk } from './u.walk.ts';
import { defaultDiscoverRefs as discoverRefs } from './u.defaultDiscoverRefs.ts';
import { build } from './u.dag.ts';

/**
 * Generic, repo-backed DAG walker for document graphs.
 */
export const Graph: t.GraphLib = {
  default: { discoverRefs },
  Dag: { build },
  walk,
};
