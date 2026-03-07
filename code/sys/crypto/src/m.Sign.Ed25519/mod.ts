/**
 * @module
 * Ed25519 signing and verification primitives over Web Crypto.
 */
import type { t } from './common.ts';
import { generateKeyPair } from './u.generateKeyPair.ts';
import { sign } from './u.sign.ts';
import { verify } from './u.verify.ts';

export const SignEd25519: t.SignEd25519.Lib = {
  generateKeyPair,
  sign,
  verify,
};
