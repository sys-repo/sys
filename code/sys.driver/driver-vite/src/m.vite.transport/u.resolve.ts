import { Is, Json, Path, Process, type t } from './common.ts';
import { loadDenoModule } from './u.load.ts';
import { isBarePackageId, toViteNpmSpecifier } from './u.npm.ts';

let checkedDenoInstall = false;
const DENO_BINARY = Deno.build.os === 'windows' ? 'deno.exe' : 'deno';

const depsDefault: t.ResolveDeps = {
  invoke: Process.invoke,
};

export function createResolvePlugin(cache: t.DenoCache, deps: t.ResolveDeps = depsDefault) {
  let root = Path.cwd();

  return {
    name: 'deno',
    configResolved(config: { root: string }) {
      root = Path.normalize(config.root);
    },
    async resolveId(
      this: {
        resolve: (
          id: string,
          importer?: string,
          options?: { readonly skipSelf?: boolean },
        ) => Promise<unknown>;
      },
      id: string,
      importer?: string,
    ) {
      const resolvedId = unwrapViteId(id);
      const resolvedImporter = importer ? unwrapViteId(importer) : importer;
      if (isDenoSpecifier(resolvedId)) return resolvedId;
      const resolved = await resolveViteSpecifier(resolvedId, cache, root, resolvedImporter, deps);
      if (Is.str(resolved) && isBarePackageId(resolved)) {
        const skipSelf = true;
        const packagePath = Path.join(Path.cwd(), 'package.json');
        const delegated = await this.resolve(resolved, packagePath, { skipSelf });
        return delegated;
      }
      return resolved;
    },
    async load(id: string) {
      const resolvedId = unwrapViteId(id);
      if (isDenoSpecifier(resolvedId)) {
        const parsed = parseDenoSpecifier(resolvedId);
        let cached = cache.get(parsed.resolved);
        if (cached?.kind === 'esm' && cached.dependencies.length === 0 && isRemoteLike(parsed.id)) {
          const hydrated = await resolveDenoWith(parsed.id, root, deps);
          if (hydrated?.kind === 'esm') {
            cache.set(hydrated.id, hydrated);
            cache.set(parsed.resolved, hydrated);
            cached = hydrated;
          }
        }
        return await loadDenoModule(resolvedId, cached?.dependencies ?? []);
      }

      return;
    },
  };
}

function isResolveError(
  info: t.ResolveInfoError | t.ResolveInfoModule,
): info is t.ResolveInfoError {
  return 'error' in info && Is.str(info.error);
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
  modules: readonly (t.ResolveInfoModule | t.ResolveInfoError)[],
): readonly t.DenoDependency[] {
  return (dependencies ?? []).map((dependency) => {
    const resolvedSpecifier = dependency.code?.specifier ?? dependency.specifier;
    const mod = modules.find(
      (info) => !isResolveError(info) && info.specifier === resolvedSpecifier,
    );

    if (mod && isResolveInfoModuleEsm(mod)) {
      return {
        specifier: dependency.specifier,
        resolvedSpecifier,
        localPath: mod.local,
        loader: mod.mediaType ?? null,
      };
    }

    return {
      specifier: dependency.specifier,
      resolvedSpecifier,
    };
  });
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
      dependencies: normalizeDependencies(mod.dependencies, json.modules),
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

  if (importer && isDenoSpecifier(importer)) {
    const { id: parentId, resolved: parent } = parseDenoSpecifier(importer);
    let cached = cache.get(parent);
    if (cached === undefined) {
      cached = (await resolveDenoWith(parentId, root, deps)) ?? undefined;
      if (cached) {
        cache.set(cached.id, cached);
        cache.set(parent, cached);
      }
    }
    if (cached === undefined) return;

    const found = cached.dependencies.find((dep) => {
      if (dep.specifier === sourceId || dep.resolvedSpecifier === sourceId) return true;
      if (dep.specifier.startsWith('npm:')) return toViteNpmSpecifier(dep.specifier) === sourceId;
      return false;
    });
    if (found === undefined) return;

    id = found.resolvedSpecifier;
    if (id.startsWith('file://')) return Path.fromFileUrl(id);
    if (id.startsWith('npm:')) return toViteNpmSpecifier(id);
    if (found.localPath && found.loader && isRemoteLike(id)) {
      const existing = cache.get(found.localPath);
      const hydrated = existing ?? (await resolveDenoWith(id, root, deps));
      if (hydrated?.kind === 'esm') {
        cache.set(hydrated.id, hydrated);
        cache.set(id, hydrated);
        return toDenoSpecifier(hydrated.loader ?? found.loader, id, hydrated.id);
      }

      cache.set(found.localPath, {
        id: found.localPath,
        kind: 'esm',
        loader: found.loader,
        dependencies: [],
      });
      return toDenoSpecifier(found.loader, id, found.localPath);
    }
  }

  const resolved = cache.get(id) ?? (await resolveDenoWith(id, root, deps));
  if (resolved === null) return;
  if (resolved.kind === 'npm') return null;

  cache.set(resolved.id, resolved);

  if (
    resolved.loader === null ||
    (resolved.id.startsWith(Path.resolve(root)) &&
      !Path.relative(root, resolved.id).startsWith('.'))
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

function isRemoteLike(specifier: string) {
  return (
    specifier.startsWith('http://') ||
    specifier.startsWith('https://') ||
    specifier.startsWith('jsr:')
  );
}

function unwrapViteId(id: string) {
  return id.startsWith('/@id/') ? id.slice('/@id/'.length).replace('__x00__', '\0') : id;
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
