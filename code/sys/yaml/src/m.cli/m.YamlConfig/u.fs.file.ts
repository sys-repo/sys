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

export const fromPkg: t.YamlConfigFileLib['fromPkg'] = (dir, pkg) => {
  const raw = Pkg.toString(pkg, undefined, false).trim();
  const name = normalizePkgName(raw);
  const flattened = Str.replaceAll(name, '/', '.').after as t.StringName;
  return create({ dir: normalizeDir(dir), basename: flattened });
};

/**
 * Helpers:
 */
function normalizePkgName(name: string): string {
  if (!name) throw new Error('Pkg name is required.');
  if (name.includes('<') || name.includes('>')) {
    throw new Error(`Invalid pkg name: "${name}".`);
  }
  if (/\s/.test(name)) {
    throw new Error(`Invalid pkg name (whitespace): "${name}".`);
  }
  const collapsed = collapseSlashes(name);
  if (!/^[A-Za-z0-9@./-]+$/.test(collapsed)) {
    throw new Error(`Invalid pkg name (characters): "${name}".`);
  }
  return collapsed;
}

function collapseSlashes(name: string): string {
  let current = name;
  while (current.includes('//')) {
    current = current.replaceAll('//', '/');
  }
  return current;
}

function normalizeDir(dir: t.StringDir): t.StringDir {
  const trimmed = String(dir).trim();
  if (!trimmed) throw new Error('Config dir is required.');
  const withoutTrail = trimmed.endsWith('/') ? trimmed.replace(/\/+$/, '') : trimmed;
  return withoutTrail as t.StringDir;
}
