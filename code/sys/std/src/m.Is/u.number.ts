export function number(input?: any): input is number {
  return typeof input === 'number' && !Number.isNaN(input);
}

/**
 * Determine if the value is numeric, whether it be a number or a number in a string.
 */
export function numeric(input?: any) {
  if (typeof input === 'number') {
    return Number.isFinite(input); // Ensure not: NaN, Infinity, or -Infinity.
  }
  if (typeof input === 'bigint') {
    return true;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed === '') return false; // Empty string, not a number.
    const num = Number(trimmed);
    return !Number.isNaN(num) && Number.isFinite(num);
  }

  return false;
}
