import type { t } from '../common.ts';

/**
 * Primitive Files-domain scalars shared across the Files type graph.
 */
export declare namespace FilesCore {
  /** Canonical root-relative file path visible inside a bounded Files view. */
  export type StringPath = t.StringRelativePath;

  /** Monotonic sequence number for change hints. */
  export type Seq = t.NumberMonotonic;

  /** Non-negative traversal depth for list/manifest scopes. */
  export type Depth = number;

  /** Page-size limit for paged command surfaces. */
  export type Limit = t.NumberTotal;

  /** Supported inline text encodings for first-land reads. */
  export type Encoding = 'utf8';

  /** Path/name selector. Glob-like; not shell syntax and not content search. */
  export type Match = t.StringGlob | readonly t.StringGlob[];

  /** Transport/backing fidelity class for a Files view. */
  export type Fidelity = 'live' | 'dynamic' | 'snapshot' | 'cache';
}
