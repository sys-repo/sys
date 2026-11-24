import { Hash } from '@sys/crypto/hash';
import type { VerifyChecksum } from './t.ts';

const STATUS = 412;
const STATUS_TEXT = 'Pre-condition failed (checksum-mismatch)';

/** Verify fetched content through the private checksum contract. */
export const verifyChecksum: VerifyChecksum = (data, expected, errors) => {
  const received = Hash.sha256(data);
  const valid = received === expected;

  if (!valid) {
    let message = `${STATUS}: ${STATUS_TEXT}. `;
    message +=
      `The hash of the fetched content ("${received}") does not match the expected checksum: "${expected}"`;
    errors.push(message);
  }

  return { valid, expected, received };
};
