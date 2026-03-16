import { type t, Is } from './common.ts';

const NPM_IMPORT_SUBPATH_ALIASES = [
  { pkg: 'react', specifier: 'react/jsx-runtime', subpath: 'jsx-runtime' },
  { pkg: 'react', specifier: 'react/jsx-dev-runtime', subpath: 'jsx-dev-runtime' },
] as const;

const NPM_IMPORT_PREFIX_ALIASES = ['react-dom', 'react-icons'] as const;

export function toNpmImportSpecifiers(pkg: t.PackageJson) {
  const imports: Record<string, string> = {};
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  for (const [name, version] of Object.entries(deps)) {
    imports[name] = `npm:${name}@${version}`;
  }

  NPM_IMPORT_SUBPATH_ALIASES.forEach((alias) => addIfPresent(imports, deps, alias));
  NPM_IMPORT_PREFIX_ALIASES.forEach((pkg) => addPrefixIfPresent(imports, deps, pkg));
  return imports;
}

export function toExportSpecifiers(name: string, exports: t.ModuleDeno['exports']) {
  const specifiers: Record<string, string> = {};
  if (!(exports && typeof exports === 'object')) return specifiers;

  for (const [key, value] of Object.entries(exports)) {
    if (!Is.str(value)) continue;
    const specifier = key === '.' ? name : `${name}/${key.replace(/^\.\//, '')}`;
    specifiers[specifier] = value;
  }

  return specifiers;
}

function addIfPresent(
  imports: Record<string, string>,
  deps: Record<string, string>,
  alias: {
    readonly pkg: string;
    readonly specifier: string;
    readonly subpath: string;
  },
) {
  const version = deps[alias.pkg];
  if (!version) return;
  imports[alias.specifier] = `npm:${alias.pkg}@${version}/${alias.subpath}`;
}

function addPrefixIfPresent(
  imports: Record<string, string>,
  deps: Record<string, string>,
  pkg: string,
) {
  const version = deps[pkg];
  if (!version) return;
  imports[`${pkg}/`] = `npm:${pkg}@${version}/`;
}
