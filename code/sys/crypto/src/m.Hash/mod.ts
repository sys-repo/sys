/**
 * @module
 * Tools for working with cryptographic hashes.
 *
 * ---
 *
 * AUDIT NOTES
 *   Crypto libraries mirror the desgin decisions made
 *   by @v on the [@farcaster/hub-web] library.
 *
 *      circa: May 2023
 *      https://github.com/farcasterxyz/hub-monorepo/tree/main/packages/hub-web
 *
 *
 * @example
 * ```ts
 * import { Hash, sha256 } from '@sys/std/hash';
 *
 * const data = new Uint8Array([1, 2, 3]);
 * const a = Hash.sha256(data);
 * const b = Hash.sha256(data);
 *
 * expect(a).to.eql(b)
 * ```
 *
 * @example
 * Create a composite hash (digest) of several values.
 * ```ts
 * import { CompositeHash } from '@sys/std/hash';
 *
 * const digest = CompositeHash.create();
 * digest
 *  .add('foo', 1234)
 *  .add('bar', binary)
 *  .toObject();
 * ```
 */
export { CompositeHash, FileHashUri } from '../m.Hash.Composite/mod.ts';
export { Hash, sha1, sha256 } from './m.Hash.ts';
