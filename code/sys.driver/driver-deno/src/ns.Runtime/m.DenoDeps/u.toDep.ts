import { type t, Esm } from './common.ts';

export const toDep: t.DepsLib['toDep'] = (input, options = {}) => {
  const { dev, wildcard } = options;
  const target = wrangle.target(options.target).toSorted();
  const module = typeof input === 'string' ? Esm.parse(input) : Esm.parse(input.toString());
  const res: t.Dep = { module, target, dev, wildcard };
  return res;
};

/**
 * Helpers
 */
const wrangle = {
  target(input?: t.DepTargetFile | t.DepTargetFile[]): t.DepTargetFile[] {
    if (!input) return ['deno.json'];
    if (typeof input === 'string') return [input];
    return input;
  },
} as const;
