import { type t } from './common.ts';
import { walk } from './u.walk.ts';

/**
 * CRDT Graph Utilities
 * Provides a generic, repo-backed DAG walker for CRDT documents.
 */
export const CrdtGraph: t.CrdtGraphLib = {
  walk,
};
