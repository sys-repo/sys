/**
 * An `Immutable<T>` implementation using [Automerge](https://automerge.org/)
 * as the [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) data-structure.
 * @module
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

/**
 * Library:
 */
export { toAutomergeHandle, toAutomergeRepo } from './m.Crdt/mod.ts';
