import type { t } from './common.ts';

/**
 * @module
 * Ed25519 signing and verification primitives over Web Crypto.
 */
export namespace SignEd25519 {
  /** Public/private CryptoKey pair used for Ed25519 signatures. */
  export type KeyPair = {
    readonly publicKey: CryptoKey;
    readonly privateKey: CryptoKey;
  };

  /** Options passed to Ed25519 key generation. */
  export type GenerateKeyPairArgs = {
    /** Whether generated keys may be exported by Web Crypto. */
    readonly extractable?: boolean;
  };

  /** Bytes and private key used to create an Ed25519 signature. */
  export type SignArgs = {
    readonly bytes: Uint8Array;
    readonly privateKey: CryptoKey;
  };

  /** Bytes, signature, and public key used to verify an Ed25519 signature. */
  export type VerifyArgs = {
    readonly bytes: Uint8Array;
    readonly signature: Uint8Array;
    readonly publicKey: CryptoKey;
  };

  /** Ed25519 key generation, signing, and verification helpers. */
  export type Lib = {
    /** Generate an Ed25519 public/private key pair using Web Crypto. */
    generateKeyPair(args?: GenerateKeyPairArgs): Promise<KeyPair>;

    /** Sign bytes with an Ed25519 private key. */
    sign(args: SignArgs): Promise<Uint8Array>;

    /** Verify an Ed25519 signature against bytes and a public key. */
    verify(args: VerifyArgs): Promise<boolean>;
  };
}
