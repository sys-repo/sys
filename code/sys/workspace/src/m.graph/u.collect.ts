import { type t, Fs, Str } from './common.ts';
import { collectInfoJson } from './u.collect.info.ts';
import { normalizeGraph } from './u.normalize.ts';
import { collectPackages } from './u.packages.ts';

const compare = Str.Compare.codeUnit();

export const collect: t.WorkspaceGraph.Lib['collect'] = async (args) => {
  const resolved = args.cwd ? Fs.resolve(args.cwd) : Fs.cwd();
  const cwd = await Fs.realPath(resolved).catch(() => resolved);
  const packages = await collectPackages(cwd, args.source);
  const roots = packages.flatMap((pkg) => pkg.entryPaths).toSorted(compare);
  if (roots.length === 0) {
    return {
      cwd,
      packages,
      roots: [],
      modules: [],
      edges: [],
    };
  }

  const info = await collectInfoJson(cwd, roots);
  return normalizeGraph({ cwd, packages, info });
};
