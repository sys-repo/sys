/**
 * Curve-specific public-key encoding and subgroup validation.
 */
export declare namespace Curves {
  /** Public curve validation surface. */
  export type Lib = {
    readonly Ed25519: Ed25519.Lib;
  };

  /**
   * Strict Ed25519 public-key admission, distinct from signature verification.
   */
  export namespace Ed25519 {
    /** Ed25519 public-key validation surface. */
    export type Lib = {
      /**
       * Accept only a canonical 32-byte encoding of a non-identity, prime-order curve point.
       * Malformed material returns false; distinguishable unexpected failures propagate.
       * Does not mutate the input or establish possession, signature validity, or trust.
       */
      readonly isValidPublicKey: (bytes: Uint8Array) => boolean;
    };
  }
}
