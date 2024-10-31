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
 */
export { CompositeHash } from './m.Composite.ts';
export { Hash, sha1, sha256 } from './m.Hash.ts';
