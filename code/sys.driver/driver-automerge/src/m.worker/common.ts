import { type t, Err } from '../common.ts';

export * from '../common.ts';
export { CrdtIs } from '../m.Crdt/m.Is.ts';

/**
 * Protocol version tag for all message envelopes
 * exchanged over the MessagePort.
 */
export const WIRE_VERSION = 1 as const;

/**
 * Helpers:
 */
export const notImpl = (msg: string) => {
  const err = new Error(`🐷 not implemented: ${msg}`);
  (err as any).kind = 'NotImplemented';
  return err;
};

export const toWorkerError = (msg: string): t.CrdtRepoError => ({
  ...Err.std(msg),
  kind: 'Worker',
});
