import type { t } from './common.ts';

/**
 * Hook that computes and tracks stats for the given CRDT doc.
 *
 * Accepts either a document reference or a document-id string.
 */
export type UseCrdtDocStats = (repo?: t.Crdt.Repo, docid?: t.Crdt.Id) => t.CrdtDocStatsHook;

/**
 * Instance snapshot of the `useDocStats` hook.
 */
export type CrdtDocStatsHook = {
  readonly info?: t.DocumentStats;
  readonly error?: t.StdError;
};
