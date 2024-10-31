import type { t } from './common.ts';

/**
 * Represents a compsite hash built out of a set of consitituent
 * hashes (eg. file hashes) calculated in a standardised consistent manner
 * based on the sorted hash-keys.
 */
export type CompositeHash = {
  /** The rollup of all the sorted component hashes. */
  readonly digest: t.StringHash;

  /** The constituent parts that make up the hash. */
  readonly parts: { readonly [key: string]: t.StringHash };
};
