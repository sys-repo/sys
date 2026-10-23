import type { t } from './common.ts';

/**
 * Tools for byte-oriented measurements.
 */
export declare namespace Bytes {
  /** Runtime library surface. */
  export type Lib = {
    /** Return the byte length of a string using canonical UTF-8 encoding semantics. */
    readonly utf8ByteLength: (input: string) => t.NumberBytes;
  };
}
