/**
 * @module
 * Ed25519 signing and verification primitives over Web Crypto.
 */
import type { t } from './common.ts';

export const SignEd25519: t.SignEd25519.Lib = {
  async generateKeyPair() {
    throw new Error('SignEd25519.generateKeyPair is not implemented yet.');
  },

  async sign() {
    throw new Error('SignEd25519.sign is not implemented yet.');
  },

  async verify() {
    throw new Error('SignEd25519.verify is not implemented yet.');
  },
};
