import { Hash } from '@sys/crypto/hash';
import type { t } from './common.ts';

export function verifyChecksum<T>(
  data: T | undefined,
  expected: t.StringHash,
  errors: t.ErrorCollection,
): t.FetchResponseChecksum {
  const actual = Hash.sha256(data);
  const valid = actual === expected;

  if (!valid) {
    let msg = '412:Pre-condition failed (checksum-mismatch). ';
    msg += `The hash of the fetched content ("${actual}") does not match the expected checksum: "${expected}"`;
    errors.push(msg);
  }

  return {
    valid,
    expected,
    actual,
  };
}
