import { type t, Graph } from './common.ts';
import { build } from './u.dag.ts';
import { defaultDiscoverRefs as discoverRefs } from './u.defaultDiscoverRefs.ts';
import { walk } from './u.walk.ts';

const { index, forEach, forEachAsync } = Graph.Dag;

/**
 * CRDT Graph Utilities
 * Provides a generic, repo-backed DAG walker for CRDT documents.
 */
export const CrdtGraph: t.CrdtGraphLib = {
  default: { discoverRefs },
  Dag: { build, index, forEach, forEachAsync },
  walk,
};
