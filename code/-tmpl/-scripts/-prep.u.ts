import { Fs } from '@sys/fs';
import { Json } from '@sys/std';
import type * as t from '@sys/types';

export type ImportMap = { imports: Record<string, string> };
export type VersionMeta = { version: string };
export type Versions = { tmpl: string; preset: string; tools: string };
export type PrepPaths = {
  tmplRepoImports: string;
  tmplRepoPackage: string;
  rootPackage: string;
  rootImports: string;
  tmplPkg: string;
  presetPkg: string;
  toolsPkg: string;
};

export const PATH = {
  fromRoot(root: string): PrepPaths {
    return {
      tmplRepoImports: Fs.join(root, 'code/-tmpl/-templates/tmpl.repo/imports.json'),
      tmplRepoPackage: Fs.join(root, 'code/-tmpl/-templates/tmpl.repo/package.json'),
      rootPackage: Fs.join(root, 'package.json'),
      rootImports: Fs.join(root, 'deno.imports.json'),
      tmplPkg: Fs.join(root, 'code/-tmpl/deno.json'),
      presetPkg: Fs.join(root, 'code/sys/preset/deno.json'),
      toolsPkg: Fs.join(root, 'code/sys.tools/deno.json'),
    };
  },
} as const;

export function syncTemplateImports(input: ImportMap, versions: Versions): ImportMap {
  const next = structuredClone(input);
  for (const [key, value] of Object.entries(next.imports)) {
    if (key.startsWith('@sys/preset/')) {
      const subpath = key.replace('@sys/preset/', '');
      next.imports[key] = `jsr:@sys/preset@${versions.preset}/${subpath}`;
      continue;
    }
    if (key === '@sys/tools') {
      next.imports[key] = `jsr:@sys/tools@${versions.tools}`;
      continue;
    }
    if (key === '@sys/tmpl') {
      next.imports[key] = `jsr:@sys/tmpl@${versions.tmpl}`;
      continue;
    }
    next.imports[key] = value;
  }
  return next;
}

export function syncTemplatePackage(input: t.PkgJsonNode, source: t.PkgJsonNode): t.PkgJsonNode {
  const allSource = { ...(source.dependencies ?? {}), ...(source.devDependencies ?? {}) };
  const next = structuredClone(input);

  const sync = (kind: 'dependencies' | 'devDependencies') => {
    const bag = next[kind];
    if (!bag) return;
    for (const key of Object.keys(bag)) {
      const latest = allSource[key];
      if (typeof latest !== 'string') {
        throw new Error(`Missing dependency "${key}" in root package.json`);
      }
      bag[key] = latest;
    }
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
