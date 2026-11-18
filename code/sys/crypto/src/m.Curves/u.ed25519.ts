import { ed25519 } from '@noble/curves/ed25519.js';
import { Is, type t } from './common.ts';

type Decode = (bytes: Uint8Array) => { is0(): boolean; isTorsionFree(): boolean };

/**
 * Validate a strict Ed25519 public-key encoding and prime-order subgroup membership.
 */
export const isValidPublicKey: t.Curves.Ed25519.Lib['isValidPublicKey'] = (bytes) =>
  isValidPublicKeyWith(bytes, (input) => ed25519.Point.fromBytes(input, false));

/** Private decoder seam for boundary-failure proof; absent from the public entry. */
export function isValidPublicKeyWith(bytes: Uint8Array, decode: Decode): boolean {
  if (!Is.uint8Array(bytes) || bytes.length !== 32) return false;
  let point;
  try {
    point = decode(bytes);
  } catch (error) {
    if (isPointDecodeRejection(error)) return false;
    throw error;
  }
  // The identity is torsion-free but excluded by this admission policy.
  // Mixed-torsion points are not small-order.
  // Keep these operations outside the decoder catch: their failures are not malformed encodings.
  return !point.is0() && point.isTorsionFree();
}

/**
 * Helpers:
 */

/** Match only Noble 2.4.0's constructor/message signals for malformed point encodings. */
function isPointDecodeRejection(error: unknown): boolean {
  if (!Is.error(error)) return false;

  if (error.constructor === Error) {
    return error.message === 'bad point: invalid y coordinate' ||
      error.message === 'bad point: x=0 and x_0=1';
  }

  if (error.constructor !== RangeError) return false;
  const min = ed25519.Point.Fp.ORDER;
  const prefix = `expected valid point.y: 0 <= n < ${min}, got `;
  if (!error.message.startsWith(prefix)) return false;

  // Clearing the sign bit leaves y < 2^255; only p through p + 18 can fail this range check.
  const coordinate = error.message.slice(prefix.length);
  if (coordinate.length !== `${min}`.length || !/^[1-9]\d*$/.test(coordinate)) return false;
  const y = BigInt(coordinate);
  return y >= min && y < (1n << 255n);
}
