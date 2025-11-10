import { is } from './u.is.ts';
import { parse } from './u.parse.ts';

/**
 * Timecode sorter.
 */
export function sort(values: readonly string[]): readonly string[] {
  const decorated = values.map((value, idx) => {
    const valid = is(value);
    return {
      idx,
      value,
      valid,
      ms: valid ? parse(value) : Number.POSITIVE_INFINITY,
    };
  });
  decorated.sort((a, b) => {
    if (a.valid && b.valid) return a.ms - b.ms;
    if (a.valid && !b.valid) return -1;
    if (!a.valid && b.valid) return 1;
    return a.idx - b.idx; // keep invalids stable
  });
  return decorated.map((d) => d.value);
}

/**
 * Comparitor.
 */
export function cmp(a: string, b: string): number {
  return parse(a) - parse(b);
}
