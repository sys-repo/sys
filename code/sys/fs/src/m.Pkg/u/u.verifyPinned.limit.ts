import { Num } from '../common.ts';
import { failure } from './u.verifyPinned.io.ts';

export function isSafeNonNegative(input: unknown): input is number {
  return Num.Is.safeInt(input) && input >= 0;
}

export function isSafePositive(input: unknown): input is number {
  return isSafeNonNegative(input) && input > 0;
}

/** Add bounded byte counts without negative values or unsafe-integer overflow. */
export function addBytes(current: number, value: number, limit: number): number {
  if (
    !isSafeNonNegative(current) ||
    !isSafeNonNegative(value) ||
    !isSafeNonNegative(limit)
  ) {
    throw failure('limit-exceeded');
  }
  const next = current + value;
  if (!Num.Is.safeInt(next) || next > limit) throw failure('limit-exceeded');
  return next;
}
