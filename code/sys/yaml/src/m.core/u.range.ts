import { type t } from './common.ts';
export * from './u.range.toLinePos.ts';

export const normalize: t.YamlRangeLib['normalize'] = (r) => {
  if (!r) return undefined;
  if (r.length === 2) return r as t.YamlRange;
  const [, , third] = r as readonly [number, number, number | undefined];
  return third === undefined ? (r.slice(0, 2) as unknown as t.YamlRange) : (r as t.YamlRange);
};
