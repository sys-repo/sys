import type { t } from './common.ts';
import { walk } from './u.walk.ts';
import { defaultDiscoverRefs } from './u.defaultDiscoverRefs.ts';
import { dag } from './u.dag.ts';

/**
 * CRDT Graph Utilities
 * Provides a generic, repo-backed DAG walker for CRDT documents.
 */
export const CrdtGraph: t.CrdtGraphLib = {
  dag,
  walk,
  default: {
    discoverRefs: defaultDiscoverRefs,
  },
};
