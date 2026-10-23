import { Num } from '../common.ts';

const SMALL_COUNT_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
] as const;

/**
 * Formats small counts as words for CLI copy, falling back to numerals.
 */
export function smallCountText(count: number): string {
  return SMALL_COUNT_WORDS[count] ?? Num.toString(count, 0);
}
