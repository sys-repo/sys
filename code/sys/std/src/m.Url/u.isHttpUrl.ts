import { type t, isRecord } from './common.ts';

/**
 * True if the input is a structured HttpUrl object.
 */
export function isHttpUrl(input: unknown): input is t.HttpUrl {
  if (!isRecord(input)) return false;

  return (
    typeof input.ok === 'boolean' &&
    typeof input.raw === 'string' &&
    typeof input.href === 'string' &&
    typeof input.join === 'function' &&
    typeof input.toString === 'function' &&
    typeof input.toURL === 'function'
  );
}
