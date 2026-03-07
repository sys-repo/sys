import { type t, Err } from '../common.ts';

export * from '../common.ts';
export { CrdtIs } from '../m.Crdt/m.Is.ts';

/**
 * Protocol version tag for all Cmd-based worker messages.
 */
export const CMD_VERSION = 1 as const;

/**
 * Helpers:
 */
export const toWorkerError = (msg: string): t.CrdtRepoError => ({
  ...Err.std(msg),
  kind: 'Worker',
});
