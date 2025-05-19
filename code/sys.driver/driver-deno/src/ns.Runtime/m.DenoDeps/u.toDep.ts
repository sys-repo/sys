import { type t, Esm } from './common.ts';

export const toDep: t.DepsLib['toDep'] = (input, options = {}) => {
  const { dev, wildcard } = options;
  const subpaths = wrangle.subpaths(options.subpaths);
  const target = wrangle.target(options.target).toSorted();
  const module = typeof input === 'string' ? Esm.parse(input) : Esm.parse(input.toString());
  const res: t.Dep = { module, target, dev, wildcard, subpaths };
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

  subpaths(input?: t.StringDir[]): string[] | undefined {
    if (!Array.isArray(input)) return;
    const subpaths = input
      .map((p) => String(p).trim())
      .filter(Boolean)
      .map((p) => p.replace(/^\/+/, '').replace(/\/+$/, ''));
    return subpaths.length === 0 ? undefined : subpaths;
  },
} as const;
