import { Fs } from '@sys/fs';
import { Json } from '@sys/std';
import type * as t from '@sys/types';

export type ImportMap = { imports: Record<string, string> };
export type VersionMeta = { version: string };
export type PackageVersions = Record<string, string>;
export type KeyValueMap = Record<string, string>;
export type PrepPaths = {
  tmplRepoImports: string;
  tmplRepoPackage: string;
  rootPackage: string;
  rootImports: string;
};

export const PATH = {
  fromRoot(root: string): PrepPaths {
    return {
      tmplRepoImports: Fs.join(root, 'code/-tmpl/-templates/tmpl.repo/imports.json'),
      tmplRepoPackage: Fs.join(root, 'code/-tmpl/-templates/tmpl.repo/package.json'),
      rootPackage: Fs.join(root, 'package.json'),
      rootImports: Fs.join(root, 'imports.json'),
    };
  },
} as const;

export function syncTemplateImports(
  input: ImportMap,
  authority: ImportMap,
  packageVersions: PackageVersions,
): ImportMap {
  const next = structuredClone(input);
  next.imports = syncByKey(next.imports, (key) => resolveImportValue(key, authority.imports, packageVersions));
  return next;
}

export function sysPackageName(specifier: string): string | undefined {
  if (!specifier.startsWith('@sys/')) return;
  const [scope, name] = specifier.split('/');
  if (!scope || !name) return;
  return `${scope}/${name}`;
}

export function syncTemplatePackage(input: t.PkgJsonNode, source: t.PkgJsonNode): t.PkgJsonNode {
  const allSource = { ...(source.dependencies ?? {}), ...(source.devDependencies ?? {}) };
  const next = structuredClone(input);

  const sync = (kind: 'dependencies' | 'devDependencies') => {
    const bag = next[kind];
    if (!bag) return;
    next[kind] = syncByKey(bag, (key) => {
      const latest = allSource[key];
      if (typeof latest !== 'string') {
        throw new Error(`Missing dependency "${key}" in root package.json`);
      }
      return latest;
    });
  };

  sync('dependencies');
  sync('devDependencies');
  return next;
}

export async function readJson<T extends t.Json>(path: string): Promise<T> {
  const res = await Fs.readJson<T>(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read JSON: ${path}`);
  return res.data;
}

export function assertImportMap(input: t.Json, source: string): ImportMap {
  const map = input as { imports?: unknown };
  if (!map.imports || typeof map.imports !== 'object') {
    throw new Error(`Expected import map shape with "imports" object: ${source}`);
  }
  return { imports: map.imports as Record<string, string> };
}

export function assertVersionMeta(input: t.Json, source: string): VersionMeta {
  const version = (input as { version?: unknown }).version;
  if (typeof version !== 'string') {
    throw new Error(`Expected "version" string field: ${source}`);
  }
  return { version };
}

export async function writeIfChanged(path: string, before: t.Json, after: t.Json) {
  const unchanged = Json.stringify(before) === Json.stringify(after);
  if (unchanged) {
    console.info(`unchanged  ${Fs.trimCwd(path)}`);
    return;
  }
  await Fs.writeJson(path, after as t.Json);
  console.info(`updated    ${Fs.trimCwd(path)}`);
}

export function syncByKey(target: KeyValueMap, resolver: (key: string, current: string) => string): KeyValueMap {
  const next = structuredClone(target);
  for (const [key, value] of Object.entries(next)) {
    next[key] = resolver(key, value);
  }
  return next;
}

function resolveImportValue(
  key: string,
  authorityImports: KeyValueMap,
  packageVersions: PackageVersions,
): string {
  const fromRoot = authorityImports[key];
  if (typeof fromRoot === 'string') return fromRoot;

  const pkg = sysPackageName(key);
  if (!pkg) {
    throw new Error(`Missing import "${key}" in root imports.json`);
  }

  const version = packageVersions[pkg];
  if (typeof version !== 'string') {
    throw new Error(`Missing version authority for package "${pkg}"`);
  }

  return `jsr:${pkg}@${version}${key.slice(pkg.length)}`;
}
