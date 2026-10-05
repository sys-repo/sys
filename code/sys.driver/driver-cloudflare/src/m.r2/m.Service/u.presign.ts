import { Bytes, Is, Num, type t } from './common.ts';

/** Validate a key for presigning and return it unchanged. */
export function toPresignKey(input: unknown): string {
  // The pinned SDK treats '?' as a query separator and leaves !'()* unescaped,
  // unlike AWS signing rules. Reject them to avoid changing the key or invalidating the signature.
  // Reject empty and dot segments too, so URL handling cannot change the object path.
  const invalid = !Is.str(input) ||
    input.length > 1024 ||
    input.trim().length === 0 ||
    !input.isWellFormed() ||
    /[\p{Cc}\\?!'()*]/u.test(input) ||
    input.split('/').some((part) => part === '' || part === '.' || part === '..') ||
    Bytes.utf8ByteLength(input) > 1024;
  if (invalid) throw new Error('R2 presigned GET key is outside the supported exact-key subset.');
  return input;
}

/** Validate the required expiry and discard all other caller-supplied options. */
export function toPresignOptions(
  input: t.R2.Bucket.PresignGetOptions,
): t.R2.Bucket.PresignGetOptions {
  const expirySeconds = input?.expirySeconds;
  if (!Num.Is.int(expirySeconds) || expirySeconds < 1 || expirySeconds > 604800) {
    throw new Error('R2 presigned GET expirySeconds must be an integer in 1–604800.');
  }
  return { expirySeconds };
}
