import { type t } from './common.ts';

/**
 * Hash formatting contracts.
 */
export declare namespace HashFmt {
  /** Hash-related console logging helpers. */
  export type Lib = {
    digest(input?: t.HashInput, options?: DigestOptions): string;
  };

  /** Options passed to `HashFmt.digest`. */
  export type DigestOptions = {
    length?: number;
    algo?: boolean;
  };
}
