import { type t, Length } from './common.ts';
import { base36 } from './u.base36.ts';

/**
 * Generates a short, collision-resistant ID.
 * Uses timestamp, an incrementing counter, and random bytes.
 *
 * @param length The total desired length of the generated CUID-like string.
 *               If not provided, a default length is used.
 * @returns A collision-resistant string of the specified length.
 */
export const cuid: t.RandomLib['cuid'] = (length = Length.cuid) => {
  // 1. Capture the current time in milliseconds and convert to base-36.
  const now = Date.now();
  const timePart = now.toString(36);

  // 2. Get the incrementing counter as a base-36 string.
  const counter = getIncrementingCounter();
  const counterPart = counter.toString(36);

  // We'll use a fixed prefix. (Similar to 'cuid')
  const prefix = 'c';

  // Determine the fixed part length.
  const fixedLength = prefix.length + timePart.length + counterPart.length;
  if (length <= fixedLength) {
    const msg = `Target length (${length}) is too short. It must be greater than ${fixedLength}.`;
    throw new Error(msg);
  }

  // Generate a random base-36 string of exactly the desired length.
  const randomPart = base36(length - fixedLength);

  // Assemble and return the final CUID.
  return `${prefix}${timePart}${counterPart}${randomPart}`;
};

/**
 * Helpers
 */

/**
 * A simple incrementing counter that resets when it reaches a certain threshold.
 * Helps maintain uniqueness when multiple IDs are generated in the same millisecond.
 */
function getIncrementingCounter(): number {
  _cuidCounter = (_cuidCounter + 1) & 0xffff; // Reset after 65535.
  return _cuidCounter;
}
let _cuidCounter = 0;
