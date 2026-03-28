import { type t, Esm, Is } from './common.ts';

export const toEntry: t.EsmDeps.Lib['toEntry'] = (input, options = {}) => {
  const { dev } = options;
  const subpaths = wrangle.subpaths(options.subpaths);
  const target = wrangle.target(options.target).toSorted();
  const module = Is.str(input) ? Esm.parse(input) : Esm.parse(input.toString());
  const res: t.EsmDeps.Entry = { module, target, dev, subpaths };
  return res;
};

const wrangle = {
  target(input?: t.EsmDeps.TargetFile | t.EsmDeps.TargetFile[]): t.EsmDeps.TargetFile[] {
    if (!input) return ['deno.json'];
    if (Is.str(input)) return [input];
    return input;
  },

  subpaths(input?: t.StringDir[]): string[] | undefined {
    if (!Array.isArray(input)) return;
    const subpaths = input
      .map((path) => String(path).trim())
      .filter(Boolean)
      .map((path) => path.replace(/^\/+/, '').replace(/\/+$/, ''));
    return subpaths.length === 0 ? undefined : subpaths;
  },
} as const;
