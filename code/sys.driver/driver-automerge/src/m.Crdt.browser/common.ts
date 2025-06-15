export * from '../common.ts';
export { CrdtIs, toAutomergeHandle, toAutomergeRepo, toRepo } from '../m.Crdt/mod.ts';

/**
 * Constants
 */
export const DEFAULTS = { database: 'crdt' } as const;
export const D = DEFAULTS;
