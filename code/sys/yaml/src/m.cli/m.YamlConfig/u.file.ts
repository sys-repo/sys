import { type t, Fs, Pkg, Str } from './common.ts';

export const create: t.YamlConfigFileLib['create'] = (args) => {
  const name = args.basename;
  return {
    dir: {
      name,
      path: Fs.join(args.dir, name) as t.StringDir,
    },
  };
};

export const fromPkg: t.YamlConfigFileLib['fromPkg'] = (pkg) => {
  const name = Pkg.toString(pkg, undefined, false);
  const flattened = Str.replaceAll(name, '/', '.').after as t.StringName;
  return create({ dir: '-config' as t.StringDir, basename: flattened });
};
