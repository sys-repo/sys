import { DenoDeps } from '@sys/driver-deno/runtime';
import type { DenoFileLib, Dep as DenoDep } from '@sys/driver-deno/t';
import { Fs } from '@sys/fs';
import { Jsr } from '@sys/registry/jsr/client';
import { c } from '@sys/cli';
import { Str } from '@sys/std/str';
import { Is } from '@sys/std/is';
import { Json } from '@sys/std/json';
import { Time } from '@sys/std/time';
import type * as t from '@sys/types';

export type ImportMap = { imports: Record<string, string> };
export type PackageVersions = Record<string, string>;
export type KeyValueMap = Record<string, string>;
export type PrepPaths = {
  tmplRepoDeps: string;
  tmplRepoImports: string;
  tmplRepoPackage: string;
  rootPackage: string;
  rootImports: string;
  rootDenoJson: string;
};

export type DenoFileVersionLib = Pick<DenoFileLib, 'workspaceVersion'>;
export type PublishedPackageVersion =
  | { kind: 'published'; version: string }
  | { kind: 'unpublished' };
export type PublishedPackageVersionLib = {
  latestVersion(pkg: string): Promise<PublishedPackageVersion>;
};
export type PublishedPackageExports =
  | { kind: 'published'; exports: Record<string, string> }
  | { kind: 'unpublished' };
export type PublishedPackageExportsLib = {
  exports(pkg: string, version: string): Promise<PublishedPackageExports>;
};

type Wait = (msec: number) => Promise<unknown>;
type PublishedPackageInfoResponse = {
  readonly ok: boolean;
  readonly status: number;
  readonly data?: { readonly exports?: Record<string, string> };
};
type PublishedPackageInfoFetcher = (
  name: string,
  version?: string,
  options?: unknown,
) => Promise<PublishedPackageInfoResponse>;

const PUBLISHED_FETCH_RETRY_DELAYS_MSEC = [0, 500, 1_000] as const;

export const PATH = {
  fromRoot(root: string): PrepPaths {
    return {
      tmplRepoDeps: Fs.join(root, 'code/-tmpl/-templates/tmpl.repo/-deps.yaml'),
      tmplRepoImports: Fs.join(root, 'code/-tmpl/-templates/tmpl.repo/imports.json'),
      tmplRepoPackage: Fs.join(root, 'code/-tmpl/-templates/tmpl.repo/-package.json'),
      rootPackage: Fs.join(root, 'package.json'),
      rootImports: Fs.join(root, 'imports.json'),
      rootDenoJson: Fs.join(root, 'deno.json'),
    };
  },
} as const;

export function syncTemplateImports(
  input: ImportMap,
  authority: ImportMap,
  packageVersions: PackageVersions,
): ImportMap {
  const next = structuredClone(input);
  next.imports = syncByKey(
    next.imports,
    (key) => resolveImportValue(key, authority.imports, packageVersions),
  );
  return next;
}

export function sysPackageName(specifier: string): string | undefined {
  if (!specifier.startsWith('@sys/')) return;
  const [scope, name] = specifier.split('/');
  if (!scope || !name) return;
  return `${scope}/${name}`;
}

export async function collectTemplateBareImports(paths: string[]): Promise<string[]> {
  const files = (await Promise.all(paths.map((path) => collectSourceFiles(path)))).flat();
  const imports = new Set<string>();

  for (const path of files) {
    const text = await Deno.readTextFile(path);
    for (const specifier of extractBareImports(text)) imports.add(specifier);
  }

  return [...imports].sort();
}

export function augmentImportMapFromSpecifiers(
  input: ImportMap,
  authority: ImportMap,
  specifiers: string[],
): ImportMap {
  const next = structuredClone(input);

  for (const specifier of specifiers) {
    const isSys = Is.str(sysPackageName(specifier));
    const hasRootAuthority = typeof authority.imports[specifier] === 'string';
    if (!isSys && !hasRootAuthority) continue;
    if (typeof next.imports[specifier] === 'string') continue;
    next.imports[specifier] = specifier;
  }

  return next;
}

export function augmentTemplateDeps(
  deps: DenoDep[],
  specifiers: string[],
  packageVersions: PackageVersions,
): DenoDep[] {
  const next = [...deps];

  for (const specifier of specifiers) {
    const pkg = sysPackageName(specifier);
    if (!pkg) continue;

    const version = packageVersions[pkg];
    if (!Is.str(version)) continue;

    const subpath = toPackageSubpath(specifier, pkg);
    const index = next.findIndex((dep) => jsrPackageName(dep.module.toString()) === pkg);

    if (index >= 0) {
      const dep = next[index];
      const subpaths = uniqueStrings([...(dep.subpaths ?? []), ...(subpath ? [subpath] : [])]);
      next[index] = DenoDeps.toDep(rewriteModuleVersion(dep.module.toString(), version), {
        target: dep.target,
        dev: dep.dev,
        subpaths: subpaths.length > 0 ? subpaths : undefined,
      });
      continue;
    }

    next.push(
      DenoDeps.toDep(`jsr:${pkg}@${version}`, {
        subpaths: subpath ? [subpath] : undefined,
      }),
    );
  }

  return next;
}

export function syncTemplatePackage(input: t.PkgNodeJson, source: t.PkgNodeJson): t.PkgNodeJson {
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

export function syncTemplateDeps(
  deps: DenoDep[],
  packageVersions: PackageVersions,
  source: t.PkgNodeJson,
): DenoDep[] {
  const allSource = { ...(source.dependencies ?? {}), ...(source.devDependencies ?? {}) };

  return deps.map((dep) => {
    const module = dep.module.toString();

    const sysPkg = jsrPackageName(module);
    if (sysPkg) {
      const version = packageVersions[sysPkg];
      if (typeof version !== 'string') {
        throw new Error(`Missing version authority for package "${sysPkg}"`);
      }

      return DenoDeps.toDep(rewriteModuleVersion(module, version), {
        target: dep.target,
        dev: dep.dev,
        subpaths: dep.subpaths,
      });
    }

    const npmPkg = npmPackageName(module);
    if (npmPkg) {
      const version = allSource[npmPkg];
      if (typeof version !== 'string') {
        throw new Error(`Missing dependency "${npmPkg}" in root package.json`);
      }

      return DenoDeps.toDep(rewriteModuleVersion(module, version), {
        target: dep.target,
        dev: dep.dev,
        subpaths: dep.subpaths,
      });
    }

    return dep;
  });
}

export async function readJson<T extends t.Json>(path: string): Promise<T> {
  const res = await Fs.readJson<T>(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read JSON: ${path}`);
  return res.data;
}

export function extractBareImports(text: string): string[] {
  const source = stripComments(text);
  const imports = new Set<string>();
  const patterns = [
    /\bfrom\s*['\"]([^'\"]+)['\"]/g,
    /\bimport\s*['\"]([^'\"]+)['\"]/g,
    /\bimport\s*\(\s*['\"]([^'\"]+)['\"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (!isBareSpecifier(specifier)) continue;
      imports.add(specifier);
    }
  }

  return [...imports].sort();
}

export function assertImportMap(input: t.Json, source: string): ImportMap {
  const map = input as { imports?: unknown };
  if (!map.imports || typeof map.imports !== 'object') {
    throw new Error(`Expected import map shape with "imports" object: ${source}`);
  }
  return { imports: map.imports as Record<string, string> };
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

export async function writeTextIfChanged(path: string, before: string, after: string) {
  if (before === after) {
    console.info(`unchanged  ${Fs.trimCwd(path)}`);
    return;
  }
  await Fs.write(path, after);
  console.info(`updated    ${Fs.trimCwd(path)}`);
}

const wrangle = {
  isUnpublished(error: unknown) {
    const e = error as { status?: number; cause?: { status?: number } };
    return e.status === 404 || e.cause?.status === 404;
  },
} as const;

export function syncByKey(
  target: KeyValueMap,
  resolver: (key: string, current: string) => string,
): KeyValueMap {
  const next = structuredClone(target);
  for (const [key, value] of Object.entries(next)) {
    next[key] = resolver(key, value);
  }
  return next;
}

export async function resolvePackageVersions(
  rootDenoJson: string,
  imports: ImportMap,
  denoFile: DenoFileVersionLib,
): Promise<PackageVersions> {
  const pkgs = [
    ...new Set(
      Object.keys(imports.imports)
        .map(sysPackageName)
        .filter((pkg): pkg is string => Is.str(pkg)),
    ),
  ];

  const entries = await Promise.all(
    pkgs.map(async (pkg) => {
      const version = await denoFile.workspaceVersion(pkg, rootDenoJson, { walkup: false });
      if (!Is.str(version)) {
        const err = `Missing workspace version authority for package "${pkg}": ${rootDenoJson}`;
        throw new Error(err);
      }
      return [pkg, version] as const;
    }),
  );

  return Object.fromEntries(entries);
}

export async function resolvePublishedPackageVersions(
  imports: ImportMap,
  published: PublishedPackageVersionLib,
  rootDenoJson: string,
  denoFile: DenoFileVersionLib,
): Promise<PackageVersions> {
  const pkgs = [
    ...new Set(
      Object.keys(imports.imports)
        .map(sysPackageName)
        .filter((pkg): pkg is string => Is.str(pkg)),
    ),
  ];

  const entries = await Promise.all(
    pkgs.map(async (pkg) => {
      const result = await published.latestVersion(pkg);
      if (result.kind === 'published') {
        return [pkg, result.version] as const;
      }

      const version = await denoFile.workspaceVersion(pkg, rootDenoJson, { walkup: false });
      if (!Is.str(version)) {
        throw new Error(
          `Missing workspace version authority for package "${pkg}": ${rootDenoJson}`,
        );
      }

      console.info(Str.dedent(`
        ${c.gray('notice')}  ${c.yellow(`"${pkg}"`)} ${
        c.gray('is not yet published on JSR; using local workspace version')
      } ${c.green(version)} ${c.gray('(expected transient state before first publish).')}
      `));

      return [pkg, version] as const;
    }),
  );

  return Object.fromEntries(entries);
}

export const PublishedVersion: PublishedPackageVersionLib = {
  async latestVersion(pkg) {
    for (const delay of PUBLISHED_FETCH_RETRY_DELAYS_MSEC) {
      if (delay > 0) await Time.wait(delay);

      try {
        const res = await Jsr.Fetch.Pkg.versions(pkg);
        const latest = res.data?.latest;
        if (res.ok && Is.str(latest)) return { kind: 'published', version: latest };

        if (res.status === 404) return { kind: 'unpublished' };
      } catch (error) {
        if (wrangle.isUnpublished(error)) return { kind: 'unpublished' };
        // retry
      }
    }

    throw new Error(`Failed to fetch JSR package versions: ${pkg}`);
  },
};

export async function readPublishedPackageExports(
  pkg: string,
  version: string,
  deps: {
    readonly info?: PublishedPackageInfoFetcher;
    readonly wait?: Wait;
  } = {},
): Promise<PublishedPackageExports> {
  const info = deps.info ?? Jsr.Fetch.Pkg.info;
  const wait = deps.wait ?? Time.wait;

  for (const delay of PUBLISHED_FETCH_RETRY_DELAYS_MSEC) {
    if (delay > 0) await wait(delay);

    try {
      const res = await info(pkg, version);
      if (res.status === 404) return { kind: 'unpublished' };
      if (res.ok && res.data) {
        return { kind: 'published', exports: { ...(res.data.exports ?? {}) } };
      }
    } catch (error) {
      if (wrangle.isUnpublished(error)) return { kind: 'unpublished' };
    }
  }

  throw new Error(`Failed to fetch JSR package exports: ${pkg}@${version}`);
}

export const PublishedExports: PublishedPackageExportsLib = {
  async exports(pkg, version) {
    return await readPublishedPackageExports(pkg, version);
  },
};

export async function assertPublishedImportExports(
  imports: ImportMap,
  packageVersions: PackageVersions,
  published: PublishedPackageExportsLib,
) {
  const pkgs = [
    ...new Set(
      Object.keys(imports.imports)
        .map(sysPackageName)
        .filter((pkg): pkg is string => Is.str(pkg)),
    ),
  ];

  for (const pkg of pkgs) {
    const version = packageVersions[pkg];
    if (!Is.str(version)) throw new Error(`Missing version authority for package "${pkg}"`);

    const result = await published.exports(pkg, version);
    if (result.kind === 'unpublished') continue;

    const keys = Object.keys(imports.imports).filter((key) => key === pkg || key.startsWith(`${pkg}/`));
    const missing = keys
      .map((key) => {
        const exportKey = key === pkg ? '.' : `.${key.slice(pkg.length)}`;
        if (result.exports[exportKey]) return undefined;
        return exportKey;
      })
      .filter((key): key is string => Is.str(key));

    if (missing.length > 0) {
      const available = Object.keys(result.exports).sort();
      throw new Error(
        `Template import authority is ahead of published JSR exports for ${pkg}@${version}: missing ${missing.join(', ')}. Published exports: ${available.join(', ')}`,
      );
    }
  }
}

function resolveImportValue(
  key: string,
  authorityImports: KeyValueMap,
  packageVersions: PackageVersions,
): string {
  const pkg = sysPackageName(key);
  if (pkg) {
    const version = packageVersions[pkg];
    if (typeof version !== 'string') {
      throw new Error(`Missing version authority for package "${pkg}"`);
    }
    return Jsr.Import.specifier(pkg, version, key.slice(pkg.length));
  }

  const fromRoot = authorityImports[key];
  if (typeof fromRoot === 'string') return fromRoot;

  throw new Error(`Missing import "${key}" in root imports.json`);
}

function npmPackageName(specifier: string): string | undefined {
  const match = specifier.match(/^npm:((?:@[^/@]+\/)?[^@/]+)@[^/]+(?:\/.*)?$/);
  return match?.[1];
}

function jsrPackageName(specifier: string): string | undefined {
  const match = specifier.match(/^jsr:((?:@[^/@]+\/)?[^@/]+)@[^/]+(?:\/.*)?$/);
  return match?.[1];
}

function rewriteModuleVersion(specifier: string, version: string): string {
  const match = specifier.match(/^([a-z]+:(?:@[^/@]+\/)?[^@/]+)@([^/]+)(\/.*)?$/);
  if (!match) return specifier;
  const [, prefix, , suffix = ''] = match;
  return `${prefix}@${version}${suffix}`;
}

async function collectSourceFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  for await (const path of walkFiles(root)) {
    if (isSourceFile(path)) files.push(path);
  }
  return files.sort();
}

async function* walkFiles(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = Fs.join(root, entry.name);
    if (entry.isDirectory) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      yield* walkFiles(path);
      continue;
    }
    if (entry.isFile) yield path;
  }
}

function isSourceFile(path: string) {
  return /\.(ts|tsx|js|jsx|mts|cts)$/.test(path);
}

function isBareSpecifier(specifier: string) {
  return !specifier.startsWith('.')
    && !specifier.startsWith('/')
    && !specifier.startsWith('file:')
    && !specifier.startsWith('data:');
}

function stripComments(text: string) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function toPackageSubpath(specifier: string, pkg: string): string | undefined {
  const suffix = specifier.slice(pkg.length).replace(/^\//, '');
  return suffix || undefined;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)].sort();
}
