import { Hash } from '@sys/crypto/hash';
import { DEFAULTS, type t } from './common.ts';

export function verifyChecksum<T>(
  data: T | undefined,
  expected: t.StringHash,
  errors: t.ErrorCollection,
): t.FetchResponseChecksum {
  const actual = Hash.sha256(data);
  const valid = actual === expected;

  if (!valid) {
    const err = DEFAULTS.error.checksumFail;
    let msg = `${err.status}: ${err.statusText}. `;
    msg += `The hash of the fetched content ("${actual}") does not match the expected checksum: "${expected}"`;
    errors.push(msg);
  }

  return {
    valid,
    expected,
    actual,
  };
}
