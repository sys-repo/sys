/**
 * @module
 * An `Immutable<T>` implementation using [Automerge](https://automerge.org/)
 * as the [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) data-structure.
 */
export { pkg } from './pkg.ts';
/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library:
 */
/** Automerge core runtime namespace. */
export { A } from './m.Crdt/mod.ts';
export { toAutomergeHandle, toAutomergeRepo } from './m.Crdt/mod.ts';
