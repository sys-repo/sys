export { Repo } from '@automerge/automerge-repo';
export { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';

import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Crdt.Sample';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name) } as const;
export const D = DEFAULTS;
