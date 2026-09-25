import { sha1 as toSha1 } from '@noble/hashes/legacy.js';
import { sha256 as toSha256 } from '@noble/hashes/sha2.js';
import { encodeBase64 } from '@std/encoding';

import { Is, Json, type t } from './common.ts';

/**
 * Generate a self-describing `SHA1` hash of the given input.
 */
export const sha1: t.Hash.Lib['sha1'] = (input, options = {}) => {
  const { prefix = true } = options;
  const bytes = toBytes(input, options);
  const hash = encodeDigest(toSha1(bytes), options.encoding);
  return hash && prefix ? `sha1-${hash}` : hash;
};

/**
 * Generate a self-describing `SHA256` hash of the given input.
 */
export const sha256: t.Hash.Lib['sha256'] = (input, options = {}) => {
  const { prefix = true } = options;
  const bytes = toBytes(input, options);
  const hash = encodeDigest(toSha256(bytes), options.encoding);
  return hash && prefix ? `sha256-${hash}` : hash;
};

export const toBytes: t.Hash.Lib['toBytes'] = (input, options = {}) => {
  if (input instanceof Uint8Array) return input;
  if (Is.arrayBufferLike(input)) return new Uint8Array(input);

  let text;
  if (typeof options.asString === 'function') {
    text = options.asString(input);
  } else if (typeof input === 'object' && input !== null) {
    text = Json.stringify(input, 0);
  } else {
    text = String(input);
  }
  return new TextEncoder().encode(text);
};

export const toHex: t.Hash.Lib['toHex'] = (bytes) => {
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    const hex = bytes[i].toString(16).padStart(2, '0');
    output += hex;
  }
  return output;
};

/** Encode raw digest bytes; input conversion and algorithm prefixes belong to the caller. */
function encodeDigest(bytes: Uint8Array, encoding: t.Hash.Options['encoding'] = 'hex'): string {
  return encoding === 'base64' ? encodeBase64(bytes) : toHex(bytes);
}
