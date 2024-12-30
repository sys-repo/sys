import type { t } from './common.ts';
import { CompositeHash as Composite } from './m.Composite.ts';
import { Is } from './m.Is.ts';
import { sha1, sha256, toBytes, toHex } from './u.hash.ts';
import { shorten } from './u.ts';

export { sha1, sha256 };

/**
 * Tools for generating and manipulating Hash's.
 */
export const Hash: t.HashLib = {
  Is,
  Composite,
  composite: Composite.builder,

  sha1,
  sha256,
  toBytes,
  toHex,
  shorten,

  toString(input) {
    if (!input) return '';
    if (typeof input === 'string') return input;
    if (Is.composite(input)) return input.digest;
    return '';
  },

  prefix(hash) {
    if (typeof hash !== 'string') return '';
    const index = hash.indexOf('-');
    return index < 0 ? '' : hash.slice(0, index);
  },
};
