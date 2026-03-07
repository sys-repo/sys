import { type t } from './common.ts';
export * from './u.range.toLinePos.ts';

export const normalize: t.YamlRangeLib['normalize'] = (r) => {
  // Accepts: undefined | null | any[]; must return canonical [a,b] or [a,b,c] or undefined.
  if (!Array.isArray(r)) return undefined;

  // Destructure the first three entries and coerce to numbers where appropriate.
  const [a, b, c] = r as ReadonlyArray<number | undefined>;

  // Require first two numbers to be finite numeric values.
  if (!Number.isFinite(a as number) || !Number.isFinite(b as number)) return undefined;

  // If third is a finite number, keep 3-tuple; otherwise return 2-tuple.
  return Number.isFinite(c as number)
    ? ([a as number, b as number, c as number] as t.YamlRange)
    : ([a as number, b as number] as t.YamlRange);
};
