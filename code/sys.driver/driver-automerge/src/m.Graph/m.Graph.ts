import type { t } from './common.ts';
import { walk } from './u.walk.ts';
import { defaultDiscoverRefs as discoverRefs } from './u.defaultDiscoverRefs.ts';
import { build } from './u.dag.ts';

/**
 * CRDT Graph Utilities
 * Provides a generic, repo-backed DAG walker for CRDT documents.
 */
export const CrdtGraph: t.CrdtGraphLib = {
  default: { discoverRefs },
  Dag: { build },
  walk,
};
