import { Is, Json, Path, Process, type t } from './common.ts';
import { loadDenoModule } from './u.load.ts';

let checkedDenoInstall = false;
const DENO_BINARY = Deno.build.os === 'windows' ? 'deno.exe' : 'deno';

const depsDefault: t.ResolveDeps = {
  invoke: Process.invoke,
  resolveImport: (id) => import.meta.resolve(id),
};

export function createResolvePlugin(cache: t.DenoCache, deps: t.ResolveDeps = depsDefault) {
  let root = Path.cwd();

  return {
    name: 'deno',
    configResolved(config: { root: string }) {
      root = Path.normalize(config.root);
    },
    async resolveId(id: string, importer?: string) {
      if (isDenoSpecifier(id)) return;
      return await resolveViteSpecifier(id, cache, root, importer, deps);
    },
    async load(id: string) {
      if (!isDenoSpecifier(id)) return;
      return await loadDenoModule(id);
    },
  };
}

function isResolveError(info: t.ResolveInfoError | t.ResolveInfoModule): info is t.ResolveInfoError {
  return 'error' in info && typeof info.error === 'string';
}

function isResolveInfoModuleEsm(
  info: t.ResolveInfoError | t.ResolveInfoModule,
): info is t.ResolveInfoModuleEsm {
  return !isResolveError(info) && info.kind === 'esm';
}

function isResolveInfoModuleNpm(
  info: t.ResolveInfoError | t.ResolveInfoModule,
): info is t.ResolveInfoModuleNpm {
  return !isResolveError(info) && info.kind === 'npm';
}

function isResolveInfoModuleExternal(
  info: t.ResolveInfoError | t.ResolveInfoModule,
): info is t.ResolveInfoModuleExternal {
  return !isResolveError(info) && info.kind === 'external';
}

function normalizeDependencies(
  dependencies: readonly t.ResolveInfoDependency[] | undefined,
): readonly t.DenoDependency[] {
  return (dependencies ?? []).map((dependency) => ({
    specifier: dependency.specifier,
    resolvedSpecifier: dependency.code?.specifier ?? dependency.specifier,
  }));
}

export async function resolveDeno(id: string, cwd: string): Promise<t.DenoResolved | null> {
  return await resolveDenoWith(id, cwd, depsDefault);
}

export async function resolveDenoWith(
  id: string,
  cwd: string,
  deps: t.ResolveDeps,
): Promise<t.DenoResolved | null> {
  if (id.startsWith('\0')) return null;

  if (!checkedDenoInstall) {
    await ensureDenoInstalled(cwd, deps);
    checkedDenoInstall = true;
  }

  const output = await deps.invoke({
    cmd: DENO_BINARY,
    args: ['info', '--json', id],
    cwd,
    silent: true,
  });
  if (!output.success) {
    const text = output.text.stderr || output.text.stdout || output.toString();
    if (text.includes('Integrity check failed')) throw new Error(text);
    return null;
  }

  const parsed = Json.safeParse<t.ResolveInfo>(output.text.stdout);
  if (!parsed.ok || !parsed.data) return null;
  const json = parsed.data;
  const actualId = json.roots[0];
  const redirected = json.redirects?.[actualId] ?? actualId;
  const mod = json.modules.find((info) => !isResolveError(info) && info.specifier === redirected);

  if (mod === undefined || isResolveError(mod)) return null;

  if (isResolveInfoModuleEsm(mod)) {
    return {
      id: mod.local,
      kind: mod.kind,
      loader: mod.mediaType ?? null,
      dependencies: normalizeDependencies(mod.dependencies),
    };
  }

  if (isResolveInfoModuleNpm(mod)) {
    return {
      id: mod.npmPackage,
      kind: mod.kind,
      loader: null,
      dependencies: [],
    };
  }

  if (isResolveInfoModuleExternal(mod)) return null;
  throw new Error(`Unsupported: ${JSON.stringify(mod, null, 2)}`);
}

export async function resolveViteSpecifier(
  id: string,
  cache: t.DenoCache,
  posixRoot: string,
  importer?: string,
  deps: t.ResolveDeps = depsDefault,
) {
  const root = Path.normalize(posixRoot);
  const sourceId = id;
  let normalizedId = id;

  if (!id.startsWith('.') && !id.startsWith('/')) {
    try {
      normalizedId = deps.resolveImport(id);
    } catch {
      // Ignore unresolved import-map / module cases here.
    }
  }

  if (importer && isDenoSpecifier(importer)) {
    const { resolved: parent } = parseDenoSpecifier(importer);
    const cached = cache.get(parent);
    if (cached === undefined) return;

    const found = cached.dependencies.find((dep) => {
      return dep.specifier === sourceId || dep.resolvedSpecifier === normalizedId;
    });
    if (found === undefined) return;

    id = found.resolvedSpecifier;
    if (id.startsWith('file://')) return Path.fromFileUrl(id);
  } else {
    id = normalizedId;
  }

  const resolved = cache.get(id) ?? await resolveDenoWith(id, root, deps);
  if (resolved === null) return;
  if (resolved.kind === 'npm') return null;

  cache.set(resolved.id, resolved);

  if (
    resolved.loader === null ||
    (resolved.id.startsWith(Path.resolve(root)) && !Path.relative(root, resolved.id).startsWith('.'))
  ) {
    return resolved.id;
  }

  return toDenoSpecifier(resolved.loader, id, resolved.id);
}

export function isDenoSpecifier(str: string) {
  return str.startsWith('\0deno');
}

export function toDenoSpecifier(loader: string, id: string, resolved: string) {
  return `\0deno::${loader}::${id}::${resolved}`;
}

export function parseDenoSpecifier(spec: string) {
  const [_, loader, id, posixPath] = spec.split('::');
  return {
    loader,
    id,
    resolved: Path.normalize(posixPath),
  };
}

async function ensureDenoInstalled(cwd: string, deps: t.ResolveDeps) {
  const res = await deps.invoke({
    cmd: DENO_BINARY,
    args: ['--version'],
    cwd,
    silent: true,
  });
  if (!res.success) {
    const text = res.text.stderr || res.text.stdout || res.toString();
    throw new Error(text || 'Deno binary could not be found. Install Deno to resolve this error.');
  }
}
