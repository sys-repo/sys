/**
 * @module
 * Strict curve public-key validation, independent of signing and application authority.
 */
import type { t } from './common.ts';
import { isValidPublicKey } from './u.ed25519.ts';

/**
 * Validate public-key encodings against curve and subgroup requirements.
 */
export const Curves: t.Curves.Lib = Object.freeze({
  Ed25519: Object.freeze({ isValidPublicKey }),
});
