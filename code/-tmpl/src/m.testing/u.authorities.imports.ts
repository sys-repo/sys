import { type t, Is } from './common.ts';

const NPM_IMPORT_SUBPATH_ALIASES = [
  { pkg: 'react', specifier: 'react/jsx-runtime', subpath: 'jsx-runtime' },
  { pkg: 'react', specifier: 'react/jsx-dev-runtime', subpath: 'jsx-dev-runtime' },
] as const;

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
  return imports;
}

export function toNpmImportedSubpathSpecifiers(
  pkg: t.PackageJson,
  specifiers: Iterable<string>,
) {
  const imports: Record<string, string> = {};
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  for (const specifier of specifiers) {
    const match = parseBarePackageSpecifier(specifier);
    if (!match || !match.subpath) continue;

    const version = deps[match.pkg];
    if (!version) continue;
    imports[specifier] = `npm:${match.pkg}@${version}${match.subpath}`;
  }

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

function parseBarePackageSpecifier(specifier: string) {
  if (!specifier.includes('/')) return undefined;
  if (specifier.startsWith('.')) return undefined;
  if (specifier.startsWith('/')) return undefined;
  if (specifier.startsWith('file:')) return undefined;
  if (specifier.startsWith('http:')) return undefined;
  if (specifier.startsWith('https:')) return undefined;
  if (specifier.startsWith('jsr:')) return undefined;
  if (specifier.startsWith('npm:')) return undefined;
  if (specifier.startsWith('node:')) return undefined;

  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    if (parts.length < 3) return undefined;
    return {
      pkg: `${parts[0]}/${parts[1]}`,
      subpath: `/${parts.slice(2).join('/')}`,
    };
  }

  const parts = specifier.split('/');
  if (parts.length < 2) return undefined;
  return {
    pkg: parts[0],
    subpath: `/${parts.slice(1).join('/')}`,
  };
}
