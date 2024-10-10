/**
 * @module
 * A promise based wrapper into the IndexedDB API.
 *
 *    https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 *    https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
 *    https://gist.github.com/JamesMessinger/a0d6389a5d0e3a24814b
 *
 * @example
 * ```ts
 * import { IndexedDb } from '@sys/std/indexeddb';
 *
 * const name = 'my-database';
 * const db = await IndexedDb.init<T>({ name, store: (db) => ({ name, db }) })
 * ```
 */
export * from './m.IndexedDb.ts';
