import { Fmt } from '../common/u.fmt.ts';
import { Perf } from '../common/u.perf.ts';
import { Is, Json, Path, Process, type t } from './common.ts';
import type { PluginContext } from 'rollup';
import { loadDenoModule } from './u.load.ts';
import { isBarePackageId, toViteNpmSpecifier } from './u.npm.ts';
import { DenoLoaderResolver, type DenoLoaderResolverInstance } from './u.resolve.loader.ts';
import {
  isDenoSpecifier,
  parseDenoSpecifier,
  repairConcreteRemoteAuthorityDelimiter,
  toDenoSpecifier,
  unwrapViteId,
} from './u.specifier.ts';

let checkedDenoInstall = false;
const DENO_BINARY = Deno.build.os === 'windows' ? 'deno.exe' : 'deno';
const TRACE_RESOLVE_ENV = 'SYS_DRIVER_VITE_TRACE_RESOLVE';
const memoDefault: t.ResolveMemo = { inflight: new Map(), settled: new Map(), alias: new Map() };
const depsDefault: t.ResolveDeps = { invoke: Process.invoke, resolveNpmPath, memo: memoDefault };
type ResolveOptions = NonNullable<Parameters<PluginContext['resolve']>[2]>;

export function createResolvePlugin(cache: t.DenoCache, deps: t.ResolveDeps = depsDefault) {
  let root = Path.cwd();
  let browserIds = false;
  let transportCacheDir = '';
  let loaderConfigPath = Path.join(root, 'deno.json');
  let loaderResolver: Promise<DenoLoaderResolverInstance> | undefined;

  const pluginDeps = {
    ...deps,
    async resolveLoader(id: string, referrer: string | undefined, cwd: string) {
      if (deps.resolveLoader) return await deps.resolveLoader(id, referrer, cwd);
      const active = await (loaderResolver ??= DenoLoaderResolver.create({
        configPath: loaderConfigPath,
        noLock: true,
      }).catch((error) => {
        loaderResolver = undefined;
        throw error;
      }));
      return await active.resolve(id, referrer);
    },
  } satisfies t.ResolveDeps;

  const disposeLoaderResolver = async () => {
    if (loaderResolver === undefined) return;
    const active = await loaderResolver.catch(() => undefined);
    active?.[Symbol.dispose]();
    loaderResolver = undefined;
  };

  const plugin = {
    name: 'deno',
    configResolved(
      config: { root: string; envDir?: string | false; command?: string; cacheDir?: string },
    ) {
      root = Path.normalize(config.root);
      const envDir = Is.str(config.envDir) ? config.envDir : config.root;
      loaderConfigPath = Path.join(Path.normalize(envDir), 'deno.json');
      browserIds = config.command === 'serve';
      if (browserIds && !Is.str(config.cacheDir)) {
        throw new Error('Expected resolved Vite cacheDir for dev transport cache.');
      }
      transportCacheDir = browserIds && Is.str(config.cacheDir)
        ? Path.resolve(config.cacheDir)
        : '';
    },
    async resolveId(
      id: string,
      importer?: string,
      options?: ResolveOptions,
    ) {
      const resolvedId = unwrapViteId(id);
      const resolvedImporter = importer ? unwrapViteId(importer) : importer;
      if (isDenoSpecifier(resolvedId)) return resolvedId;
      const resolved = await resolveViteSpecifier(
        resolvedId,
        cache,
        root,
        resolvedImporter,
        pluginDeps,
      );
      if (Is.str(resolved) && isBarePackageId(resolved)) {
        const skipSelf = true;
        const importerForResolve = Path.join(root, 'deno.json');
        const delegated = await this.resolve(resolved, importerForResolve, {
          ...options,
          skipSelf,
        });
        if (delegated) return delegated;

        const fallback =
          await (deps.resolveNpmPath?.(resolved, root) ?? resolveNpmPath(resolved, root));
        return fallback ?? null;
      }
      return resolved;
    },
    async load(id: string) {
      const resolvedId = unwrapViteId(id);
      if (isDenoSpecifier(resolvedId)) {
        const parsed = parseDenoSpecifier(resolvedId);
        let cached = cache.get(parsed.resolved);
        if (
          (cached === undefined || (cached.kind === 'esm' && cached.dependencies.length === 0)) &&
          isRemoteLike(parsed.id)
        ) {
          const hydrated = await resolveDenoWith(parsed.id, root, pluginDeps);
          if (hydrated?.kind === 'esm') {
            cache.set(hydrated.id, hydrated);
            cache.set(parsed.resolved, hydrated);
            cached = hydrated;
          }
        }
        return await loadDenoModule(resolvedId, cached?.dependencies ?? [], {
          browserIds,
          sourceSpecifier: cached?.kind === 'esm' ? cached.specifier : undefined,
          transformCacheDir: transportCacheDir,
        });
      }

      return;
    },
    async buildEnd() {
      await disposeLoaderResolver();
    },
    async closeBundle() {
      await disposeLoaderResolver();
    },
  } satisfies t.VitePlugin;

  return plugin;
}

/**
 * Helpers:
 */
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
      const sourceSpecifier = mod.specifier !== resolvedSpecifier && isRemoteLike(mod.specifier)
        ? mod.specifier
        : undefined;
      return {
        specifier: dependency.specifier,
        resolvedSpecifier,
        ...(sourceSpecifier ? { sourceSpecifier } : {}),
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

export async function resolveNpmPath(id: string, cwd: string): Promise<string | null> {
  return await resolveNpmPathWith(id, cwd, depsDefault);
}

export async function resolveDenoWith(
  id: string,
  cwd: string,
  deps: t.ResolveDeps,
): Promise<t.DenoResolved | null> {
  if (id.startsWith('\0')) {
    Perf.sample('transport.resolveDeno', 0 as t.Msecs, {
      id,
      cwd,
      skipped: true,
      reason: 'null-byte',
    }, {
      level: 3,
    });
    trace.resolve('request.skip', { id, cwd, reason: 'null-byte' });
    return null;
  }

  const key = wrangle.requestKey(id, cwd);
  const canonical = wrangle.canonicalKey(key, deps.memo);
  trace.resolve('request', {
    id,
    cwd,
    key,
    canonical,
    canonicalChanged: canonical !== key,
  });

  const settled = deps.memo?.settled.get(canonical);
  if (settled) {
    Perf.log(canonical === key ? 'transport.resolveDeno.settled' : 'transport.resolveDeno.alias', {
      id,
      cwd,
    }, {
      level: 3,
      dedupeKey: canonical === key
        ? `transport.resolveDeno.settled:${canonical}:${cwd}`
        : `transport.resolveDeno.alias:${key}:${canonical}:${cwd}`,
    });
    trace.resolve(canonical === key ? 'hit.settled' : 'hit.alias', {
      id,
      cwd,
      key,
      canonical,
      resolvedId: settled.id,
      kind: settled.kind,
      loader: settled.loader ?? '',
      dependencies: settled.dependencies.length,
    });
    return settled;
  }

  const inflight = deps.memo?.inflight.get(canonical);
  if (inflight) {
    Perf.log('transport.resolveDeno.inflight', { id, cwd }, {
      level: 3,
      dedupeKey: `transport.resolveDeno.inflight:${canonical}:${cwd}`,
    });
    trace.resolve('hit.inflight', { id, cwd, key, canonical });
    return await inflight;
  }

  trace.resolve('miss', { id, cwd, key, canonical });
  const run = (async () => {
    const end = Perf.section('transport.resolveDeno', { id, cwd }, {
      level: 2,
      thresholdMs: 20 as t.Msecs,
    });
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
      trace.resolve('result.error', { id, cwd, key, canonical, error: text });
      if (text.includes('Integrity check failed')) throw new Error(text);
      end({ ok: false, success: false });
      return null;
    }

    const parsed = Json.safeParse<t.ResolveInfo>(output.text.stdout);
    if (!parsed.ok || !parsed.data) {
      trace.resolve('result.error', { id, cwd, key, canonical, reason: 'json-parse' });
      end({ ok: false, parsed: false });
      return null;
    }
    const json = parsed.data;
    const actualId = json.roots[0];
    const redirected = json.redirects?.[actualId] ?? actualId;
    const mod = json.modules.find((info) => !isResolveError(info) && info.specifier === redirected);

    if (mod === undefined || isResolveError(mod)) {
      trace.resolve('result.error', {
        id,
        cwd,
        key,
        canonical,
        actualId,
        redirected,
        reason: 'module-not-found',
      });
      end({ ok: false, redirected });
      return null;
    }

    if (isResolveInfoModuleEsm(mod)) {
      const sourceSpecifier = mod.specifier !== id && isRemoteLike(mod.specifier)
        ? mod.specifier
        : undefined;
      const resolved = {
        id: mod.local,
        ...(sourceSpecifier ? { specifier: sourceSpecifier } : {}),
        kind: mod.kind,
        loader: mod.mediaType ?? null,
        dependencies: normalizeDependencies(mod.dependencies, json.modules),
      };
      const aliasKeys = wrangle.aliasKeys({ input: key, actualId, redirected, cwd });
      wrangle.memoizeResolved(deps.memo, {
        canonical,
        input: key,
        actualId,
        redirected,
        cwd,
        resolved,
      });
      trace.resolve('result.resolved', {
        id,
        cwd,
        key,
        canonical,
        actualId,
        redirected,
        moduleSpecifier: mod.specifier,
        resolvedId: resolved.id,
        kind: resolved.kind,
        loader: resolved.loader ?? '',
        dependencies: resolved.dependencies.length,
        aliasKeys,
      });
      end({
        ok: true,
        kind: resolved.kind,
        loader: resolved.loader ?? '',
        dependencies: resolved.dependencies.length,
      });
      return resolved;
    }

    if (isResolveInfoModuleNpm(mod)) {
      const resolved = {
        id: mod.npmPackage,
        kind: mod.kind,
        loader: null,
        dependencies: [] as const,
      };
      const aliasKeys = wrangle.aliasKeys({ input: key, actualId, redirected, cwd });
      wrangle.memoizeResolved(deps.memo, {
        canonical,
        input: key,
        actualId,
        redirected,
        cwd,
        resolved,
      });
      trace.resolve('result.resolved', {
        id,
        cwd,
        key,
        canonical,
        actualId,
        redirected,
        moduleSpecifier: mod.specifier,
        resolvedId: resolved.id,
        kind: resolved.kind,
        dependencies: 0,
        aliasKeys,
      });
      end({ ok: true, kind: resolved.kind, dependencies: 0 });
      return resolved;
    }

    if (isResolveInfoModuleExternal(mod)) {
      trace.resolve('result.external', {
        id,
        cwd,
        key,
        canonical,
        actualId,
        redirected,
        moduleSpecifier: mod.specifier,
      });
      end({ ok: true, kind: mod.kind, external: true });
      return null;
    }
    throw new Error(`Unsupported: ${Json.stringify(mod, 2)}`);
  })();

  if (!deps.memo) return await run;

  deps.memo.inflight.set(canonical, run);
  try {
    return await run;
  } finally {
    deps.memo.inflight.delete(canonical);
  }
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
    trace.resolve('importer.request', { sourceId, importer, parentId, parent });
    let cached = cache.get(parent);
    if (
      isRemoteLike(parentId) &&
      (cached === undefined || (cached.kind === 'esm' && cached.dependencies.length === 0))
    ) {
      cached = (await resolveDenoWith(parentId, root, deps)) ?? cached;
      if (cached) {
        cache.set(cached.id, cached);
        cache.set(parent, cached);
      }
    }
    let matchedDependency = false;
    if (cached) {
      const found = cached.dependencies.find((dep) => {
        if (
          dep.specifier === sourceId || dep.resolvedSpecifier === sourceId ||
          dep.sourceSpecifier === sourceId
        ) return true;
        if (dep.specifier.startsWith('npm:')) return toViteNpmSpecifier(dep.specifier) === sourceId;
        return false;
      });
      if (found) {
        matchedDependency = true;
        trace.resolve('importer.hit', {
          sourceId,
          importer,
          parentId,
          parent,
          specifier: found.specifier,
          resolvedSpecifier: found.resolvedSpecifier,
          sourceSpecifier: found.sourceSpecifier ?? '',
          localPath: found.localPath,
          loader: found.loader ?? '',
        });

        id = found.resolvedSpecifier;
        if (id.startsWith('file://')) return Path.fromFileUrl(id);
        if (id.startsWith('npm:')) {
          await resolveDenoWith(id, root, deps);
          return toViteNpmSpecifier(id);
        }
        if (found.localPath && found.loader && isRemoteLike(id)) {
          const existing = cache.get(found.localPath);
          const hydrated = existing ??
            (await resolveDenoWith(found.sourceSpecifier ?? id, root, deps));
          if (hydrated?.kind === 'esm') {
            cache.set(hydrated.id, hydrated);
            cache.set(id, hydrated);
            return toDenoSpecifier(hydrated.loader ?? found.loader, id, hydrated.id);
          }

          cache.set(found.localPath, {
            id: found.localPath,
            ...(found.sourceSpecifier ? { specifier: found.sourceSpecifier } : {}),
            kind: 'esm',
            loader: found.loader,
            dependencies: [],
          });
          return toDenoSpecifier(found.loader, id, found.localPath);
        }
      }
    }

    if (!matchedDependency) {
      const loaderResolved = await resolveWithLoader(sourceId, root, deps, {
        referrer: loaderReferrerFromDenoImporter(parentId, parent),
      });
      const loaderAdapted = adaptLoaderResolution(sourceId, loaderResolved, cache, root);
      if (loaderAdapted !== undefined) return loaderAdapted;

      trace.resolve('importer.miss', { sourceId, importer, parentId, parent });
      return;
    }
  }

  const cached = cache.get(id);
  if (cached) return adaptCachedResolution(id, cached, cache, root);

  const loaderResolved = await resolveWithLoader(id, root, deps, {
    referrer: loaderReferrerFromViteImporter(importer, root),
  });
  const loaderAdapted = adaptLoaderResolution(id, loaderResolved, cache, root);
  if (loaderAdapted !== undefined) return loaderAdapted;

  const resolved = await resolveDenoWith(id, root, deps);
  if (resolved === null) return;
  return adaptCachedResolution(id, resolved, cache, root);
}

async function resolveWithLoader(
  id: string,
  root: string,
  deps: t.ResolveDeps,
  options: { readonly referrer?: string },
) {
  if (id.startsWith('\0') || id.startsWith('npm:')) return;
  if (!deps.resolveLoader) return;

  try {
    return await deps.resolveLoader(id, options.referrer, root) ?? undefined;
  } catch (error) {
    trace.resolve('loader.fallback', {
      id,
      root,
      referrer: options.referrer ?? '',
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }
}

function adaptLoaderResolution(
  id: string,
  resolvedUrl: string | null | undefined,
  cache: t.DenoCache,
  root: string,
) {
  if (!resolvedUrl) return;
  if (resolvedUrl.startsWith('node:')) return null;
  if (!resolvedUrl.startsWith('file://')) return;

  const resolvedPath = Path.fromFileUrl(resolvedUrl);
  if (isNodeModulesPath(resolvedPath)) return;

  const loader = mediaTypeFromPath(resolvedPath);
  const resolved = {
    id: resolvedPath,
    kind: 'esm',
    loader,
    dependencies: [],
  } satisfies t.DenoResolved;
  cache.set(id, resolved);
  cache.set(resolvedPath, resolved);
  return adaptCachedResolution(id, resolved, cache, root);
}

function adaptCachedResolution(
  id: string,
  resolved: t.DenoResolved,
  cache: t.DenoCache,
  root: string,
) {
  if (resolved.kind === 'npm') return null;

  cache.set(resolved.id, resolved);

  if (resolved.loader === null || isInRoot(resolved.id, root)) {
    return resolved.id;
  }

  return toDenoSpecifier(resolved.loader, id, resolved.id);
}

function loaderReferrerFromDenoImporter(parentId: string, parent: string) {
  return isRemoteLike(parentId)
    ? repairConcreteRemoteAuthorityDelimiter(parentId)
    : pathToFileUrl(parent);
}

function loaderReferrerFromViteImporter(importer: string | undefined, root: string) {
  if (!importer) return;
  if (importer.startsWith('file://')) return importer;
  if (isRemoteLike(importer)) return repairConcreteRemoteAuthorityDelimiter(importer);
  if (Path.Is.absolute(importer)) return pathToFileUrl(importer);
  return pathToFileUrl(Path.join(root, importer));
}

function pathToFileUrl(path: string) {
  return Path.toFileUrl(path).href;
}

function isInRoot(path: string, root: string) {
  return path.startsWith(Path.resolve(root)) && !Path.relative(root, path).startsWith('.');
}

function isNodeModulesPath(path: string) {
  return path.split(/[\\/]/).includes('node_modules');
}

function mediaTypeFromPath(path: string): t.DenoLoader {
  switch (Path.extname(path).toLowerCase()) {
    case '.jsx':
      return 'JSX';
    case '.json':
      return 'Json';
    case '.tsx':
      return 'TSX';
    case '.ts':
    case '.mts':
    case '.cts':
      return 'TypeScript';
    default:
      return 'JavaScript';
  }
}

export async function resolveNpmPathWith(
  id: string,
  cwd: string,
  deps: t.ResolveDeps,
): Promise<string | null> {
  const end = Perf.section('transport.resolveNpmPath', { id, cwd }, {
    level: 2,
    thresholdMs: 20 as t.Msecs,
  });
  const output = await deps.invoke({
    cmd: DENO_BINARY,
    args: ['eval', 'console.log(import.meta.resolve(Deno.args[0]))', id],
    cwd,
    silent: true,
  });
  if (!output.success) {
    end({ ok: false });
    return null;
  }

  const value = output.text.stdout.trim();
  if (!value.startsWith('file://')) {
    end({ ok: false, fileUrl: false });
    return null;
  }
  const path = Path.fromFileUrl(value);
  end({ ok: true, path });
  return path;
}

function isRemoteLike(specifier: string) {
  return (
    specifier.startsWith('http://') ||
    specifier.startsWith('https://') ||
    specifier.startsWith('jsr:')
  );
}

const wrangle = {
  requestKey(id: string, cwd: string) {
    return Json.stringify([Path.normalize(cwd), repairConcreteRemoteAuthorityDelimiter(id)]);
  },

  canonicalKey(key: string, memo?: t.ResolveMemo) {
    return memo?.alias.get(key) ?? key;
  },

  memoizeResolved(
    memo: t.ResolveMemo | undefined,
    args: {
      canonical: string;
      input: string;
      actualId: string;
      redirected: string;
      cwd: string;
      resolved: t.DenoResolved;
    },
  ) {
    if (!memo) return;
    memo.settled.set(args.canonical, args.resolved);
    for (const key of wrangle.aliasKeys(args)) {
      memo.alias.set(key, args.canonical);
    }
  },

  aliasKeys(args: { input: string; actualId: string; redirected: string; cwd: string }) {
    return [
      ...new Set([
        args.input,
        wrangle.requestKey(args.actualId, args.cwd),
        wrangle.requestKey(args.redirected, args.cwd),
      ]),
    ];
  },
} as const;

const trace = {
  enabled() {
    const value = Deno.env.get(TRACE_RESOLVE_ENV)?.trim().toLowerCase();
    return value !== undefined && value !== '' && value !== '0' && value !== 'false' &&
      value !== 'off' && value !== 'no';
  },

  resolve(label: string, meta: Record<string, unknown>) {
    if (!trace.enabled()) return;
    const suffix = Object.entries(meta)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => Fmt.Diag.meta(key, value))
      .filter(Boolean)
      .join(' ');
    console.info(
      `${Fmt.Diag.prefix('trace', { detail: `resolve.${label}` })}${suffix ? ` ${suffix}` : ''}`,
    );
  },
} as const;

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
