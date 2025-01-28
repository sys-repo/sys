/**
 * Generates a random base-36 string of exactly the specified length.
 *
 * To calculate how many random bytes are needed to generate a base-36 string
 * with a specific number of characters, the following formular is used:
 *
 *    bytesNeeded = ceil((targetChars * ln(36)) / ln(256))
 *
 * If the conversion produces more characters than needed (due to number magnitude),
 * the result is padded (with leading zeros if necessary) and then trimmed.
 *
 * @param length The desired length of the base-36 random string.
 * @returns A string consisting of exactly targetChars base-36 characters.
 */
export function base36(length: number): string {
  // Calculate how many random bytes are needed.
  const bytesNeeded = Math.ceil((length * Math.log(36)) / Math.log(256));
  const bytes = new Uint8Array(bytesNeeded);
  crypto.getRandomValues(bytes);

  // Convert the random bytes to a base-36 string.
  let str = bytesToBase36(bytes);
  if (str.length < length) str = str.padStart(length, '0');
  return str.slice(0, length);
}

/**
 * Converts a Uint8Array to a base-36 string.
 *
 * @param bytes The Uint8Array to convert.
 * @returns The base-36 representation of the given bytes.
 */
export function bytesToBase36(bytes: Uint8Array): string {
  let num = 0n;
  for (const b of bytes) {
    num = (num << 8n) | BigInt(b);
  }
  return num.toString(36);
}
