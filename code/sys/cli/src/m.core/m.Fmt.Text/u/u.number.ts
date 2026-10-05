import { MAX_TERMINAL_CELLS } from '../../u/u.layout.ts';
import { assertTextPresentationAuthority, TextIntrinsic, TextNumeric } from './u.authority.ts';

export function optionalPositiveInt(input: number | undefined): number | undefined {
  assertTextPresentationAuthority();
  if (typeof input !== 'number' || !TextIntrinsic.numberIsFinite(input)) return undefined;
  const value = TextNumeric.floor(input);
  return value > 0 && value <= MAX_TERMINAL_CELLS ? value : undefined;
}

export function nonNegativeInt(input: number | undefined, fallback: number): number {
  assertTextPresentationAuthority();
  if (typeof input !== 'number' || !TextIntrinsic.numberIsFinite(input)) return fallback;
  const value = TextNumeric.floor(input);
  return value <= MAX_TERMINAL_CELLS ? TextNumeric.max(0, value) : fallback;
}
