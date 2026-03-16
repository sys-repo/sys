import { type t, Is, Obj } from './common.ts';

export function toNpmImportSpecifiers(pkg: t.PackageJson) {
  const imports: Record<string, string> = {};
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  for (const [name, version] of Object.entries(deps)) {
    imports[name] = `npm:${name}@${version}`;
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
  pkg: string,
  specifier: string,
  subpath: string,
) {
  const version = deps[pkg];
  if (!version) return;
  imports[specifier] = `npm:${pkg}@${version}/${subpath}`;
}

function addPrefixIfPresent(imports: Record<string, string>, deps: Record<string, string>, pkg: string) {
  const version = deps[pkg];
  if (!version) return;
  imports[`${pkg}/`] = `npm:${pkg}@${version}/`;
}
