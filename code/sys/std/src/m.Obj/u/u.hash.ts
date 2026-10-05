import { hash as hashit } from 'hash-it';
import { type t } from '../common.ts';

/**
 * Create a fast, non-cryptographic number hash for transient equality and cache keys.
 *
 * Equal value-based inputs hash identically within one `hash-it` version and environment. The
 * numeric result may change across dependency or runtime versions, and collisions remain possible.
 * Do not persist it, use it as a protocol identifier, or rely on it for security.
 */
export const hash: t.Obj.Lib['hash'] = <T>(value: T): number => {
  return hashit<T>(value);
};
