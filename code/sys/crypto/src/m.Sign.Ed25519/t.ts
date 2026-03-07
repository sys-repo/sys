import type { t } from './common.ts';

/**
 * @module
 * Ed25519 signing and verification primitives over Web Crypto.
 */
export namespace SignEd25519 {
  export type KeyPair = {
    readonly publicKey: CryptoKey;
    readonly privateKey: CryptoKey;
  };

  export type GenerateKeyPairArgs = {
    readonly extractable?: boolean;
  };

  export type SignArgs = {
    readonly bytes: Uint8Array;
    readonly privateKey: CryptoKey;
  };

  export type VerifyArgs = {
    readonly bytes: Uint8Array;
    readonly signature: Uint8Array;
    readonly publicKey: CryptoKey;
  };

  export type Lib = {
    generateKeyPair(args?: GenerateKeyPairArgs): Promise<KeyPair>;
    sign(args: SignArgs): Promise<Uint8Array>;
    verify(args: VerifyArgs): Promise<boolean>;
  };
}
