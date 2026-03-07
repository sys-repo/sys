import type { t } from './common.ts';
import { walk } from './u.walk.ts';
import { defaultDiscoverRefs as discoverRefs } from './u.defaultDiscoverRefs.ts';
import { build } from './u.dag.ts';
import { index } from './u.index.ts';
import { forEach, forEachAsync } from './u.forEach.ts';

/**
 * Generic, repo-backed DAG walker for document graphs.
 */
export const Graph: t.GraphLib = {
  default: { discoverRefs },
  Dag: { build, index, forEach, forEachAsync },
  walk,
};
