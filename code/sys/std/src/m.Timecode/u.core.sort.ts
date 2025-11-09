import { type t } from './common.ts';
import { parseMs } from './u.core.parse.ts';
import { is } from './u.ts';

export function sort(values: readonly string[]): readonly string[] {
  const decorated = values.map((value, idx) => {
    const valid = is(value);
    return {
      idx,
      value,
      valid,
      ms: valid ? parseMs(value) : Number.POSITIVE_INFINITY,
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

export function cmp(a: string, b: string): number {
  return parseMs(a) - parseMs(b);
}
