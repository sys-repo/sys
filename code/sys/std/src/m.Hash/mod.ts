/**
 * AUDIT NOTES
 *   Crypto libraries mirror the desgin decisions made
 *   by @v on the [@farcaster/hub-web] library.
 *
 *      circa: May 2023
 *      https://github.com/farcasterxyz/hub-monorepo/tree/main/packages/hub-web
 *
 *  */
import { sha1 } from '@noble/hashes/sha1';
import { sha256 } from '@noble/hashes/sha256';
import { R, type t } from '../common.ts';
import { shortenHash } from './u.ts';

export const Hash: t.HashLib = {
  sha1(input, options = {}) {
    const { prefix = true } = options;
    const bytes = Hash.toBytes(input, options);
    const hash = Hash.toHex(sha1(bytes));
    return hash && prefix ? `sha1-${hash}` : hash;
  },

  sha256(input, options = {}) {
    const { prefix = true } = options;
    const bytes = Hash.toBytes(input, options);
    const hash = Hash.toHex(sha256(bytes));
    return hash && prefix ? `sha256-${hash}` : hash;
  },

  toBytes(input, options = {}) {
    if (input instanceof Uint8Array) return input;
    const text = (options.asString ?? R.toString)(input);
    return new TextEncoder().encode(text);
  },

  toHex(bytes) {
    let output = '';
    for (let i = 0; i < bytes.length; i++) {
      const hex = bytes[i].toString(16).padStart(2, '0');
      output += hex;
    }
    return output;
  },

  /**
   * Shorten a hash for display.
   */
  shorten(hash, length, options) {
    return shortenHash(hash, length, options);
  },
};
