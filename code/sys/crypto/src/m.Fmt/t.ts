import type { t } from './common.ts';

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
    /** Maximum rendered cell width; progressively elides context to fit. */
    maxWidth?: number;
    /** Prepend the standard incoming-reference arrow within the maximum width. */
    arrow?: boolean;
    /** Navigation target applied only to the visible digest label. */
    url?: URL;
  };
}
