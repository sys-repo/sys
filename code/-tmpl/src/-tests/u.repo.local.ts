import { type t, Fs, Path } from '../-test.ts';

type ImportMap = { readonly imports: Record<string, string> };
type WorkspaceDeno = { readonly workspace?: readonly string[] };
type ModuleDeno = { readonly name?: unknown; readonly exports?: Record<string, unknown> };

const SYS_ROOT = Path.fromFileUrl(new URL('../../../..', import.meta.url));
let localAuthoritiesPromise: Promise<Record<string, string>> | undefined;

/**
 * Integration-test-only rewrite: point generated temp repos at the local
 * `@sys/*` workspace graph plus the root third-party import authorities.
 */
export async function rewriteLocalRepoAuthorities(root: string) {
  const path = Fs.join(root, 'imports.json');
  const current = await readImportMap(path);
  const localAuthorities = await loadLocalAuthorities();

  await Fs.writeJson(path, {
    imports: {
      ...current.imports,
      ...localAuthorities,
    },
  });
}

export async function readRepoAuthorities(root: string) {
  return await readImportMap(Fs.join(root, 'imports.json'));
}

export async function poisonSysVersions(
  root: string,
  packages: readonly string[],
  version = '999.0.0',
) {
  const path = Fs.join(root, 'imports.json');
  const current = await readImportMap(path);
  const next = structuredClone(current);

  for (const [key, value] of Object.entries(next.imports)) {
    const pkg = packages.find((item) => key === item || key.startsWith(`${item}/`));
    if (!pkg) continue;

    const suffix = key.slice(pkg.length);
    const nextValue = `jsr:${pkg}@${version}${suffix}`;
    next.imports[key] = value.startsWith('jsr:') ? nextValue : value;
  }

  await Fs.writeJson(path, next);
}

async function loadLocalAuthorities() {
  localAuthoritiesPromise ??= buildLocalAuthorities();
  return await localAuthoritiesPromise;
}

async function buildLocalAuthorities() {
  const rootImportMap = await readImportMap(Fs.join(SYS_ROOT, 'deno.imports.json'));
  const rootDeno = await readJson<WorkspaceDeno>(Fs.join(SYS_ROOT, 'deno.json'));
  const localImports: Record<string, string> = { ...rootImportMap.imports };

  for (const rel of rootDeno.workspace ?? []) {
    const dir = Fs.join(SYS_ROOT, rel);
    const denoPath = Fs.join(dir, 'deno.json');
    if (!(await Fs.exists(denoPath))) continue;

    const deno = await readJson<ModuleDeno>(denoPath);
    if (typeof deno.name !== 'string' || !deno.name.startsWith('@sys/')) continue;

    for (const [specifier, target] of Object.entries(toExportSpecifiers(deno.name, deno.exports))) {
      localImports[specifier] = Fs.join(dir, target);
    }
  }

  return localImports;
}

function toExportSpecifiers(name: string, exports: ModuleDeno['exports']) {
  const specifiers: Record<string, string> = {};
  if (!exports || typeof exports !== 'object') return specifiers;

  for (const [key, value] of Object.entries(exports)) {
    if (typeof value !== 'string') continue;

    const specifier = key === '.' ? name : `${name}/${key.replace(/^\.\//, '')}`;
    specifiers[specifier] = value;
  }

  return specifiers;
}

async function readImportMap(path: string) {
  const json = await readJson<t.Json>(path);
  const imports = (json as { imports?: unknown }).imports;
  if (!imports || typeof imports !== 'object') {
    throw new Error(`Expected import map shape at ${path}`);
  }

  return { imports: imports as Record<string, string> };
}

async function readJson<T>(path: string): Promise<T> {
  const res = await Fs.readJson(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read JSON: ${path}`);
  return res.data as T;
}
