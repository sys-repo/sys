import { Hash } from '@sys/crypto/hash';
import type { t } from '../common.ts';

const STATUS = 412;
const STATUS_TEXT = 'Pre-condition failed (checksum-mismatch)';

export function verifyChecksum<T>(
  data: T | undefined,
  expected: t.StringHash,
  errors: t.ErrorCollection,
): t.HttpFetch.ResponseChecksum {
  const actual = Hash.sha256(data);
  const valid = actual === expected;

  if (!valid) {
    let message = `${STATUS}: ${STATUS_TEXT}. `;
    message +=
      `The hash of the fetched content ("${actual}") does not match the expected checksum: "${expected}"`;
    errors.push(message);
  }

  return { valid, expected, actual };
}
