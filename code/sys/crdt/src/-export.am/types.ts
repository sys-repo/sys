/**
 * @module
 * Public CRDT type surface for `@sys/crdt`.
 *
 * Re-exports the canonical types from `@sys/driver-automerge/t`.
 */
export type * as t from './types.ts';

/**
 * Pass-through: driver type exports.
 */
export * from '@sys/driver-automerge/t';
