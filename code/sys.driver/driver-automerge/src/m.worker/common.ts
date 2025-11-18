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
