import { type t, Is, Json } from './common.ts';

import { sha1 as toSha1 } from '@noble/hashes/sha1';
import { sha256 as toSha256 } from '@noble/hashes/sha256';

/**
 * Generate a self-describing SHA1 hash of the given input.
 */
export const sha1: t.HashLib['sha1'] = (input, options = {}) => {
  const { prefix = true } = options;
  const bytes = toBytes(input, options);
  const hash = toHex(toSha1(bytes));
  return hash && prefix ? `sha1-${hash}` : hash;
};

/**
 * Generate a self-describing SHA256 hash of the given input.
 */
export const sha256: t.HashLib['sha256'] = (input, options = {}) => {
  const { prefix = true } = options;
  const bytes = toBytes(input, options);
  const hash = toHex(toSha256(bytes));
  return hash && prefix ? `sha256-${hash}` : hash;
};

export const toBytes: t.HashLib['toBytes'] = (input, options = {}) => {
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

export const toHex: t.HashLib['toHex'] = (bytes) => {
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    const hex = bytes[i].toString(16).padStart(2, '0');
    output += hex;
  }
  return output;
};
