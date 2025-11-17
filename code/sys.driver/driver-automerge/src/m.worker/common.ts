export * from '../common.ts';
export { CrdtIs } from '../m.Crdt/m.Is.ts';

/**
 * Protocol version tag for all message envelopes
 * exchanged over the MessagePort.
 */
export const WIRE_VERSION = 1 as const;
