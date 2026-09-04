import { DenoFile, Fs, Is, Path, type t } from '../common.ts';
import type { PluginContext } from 'rollup';
import { loadDenoModule } from '../u/u.load.ts';
import { isBarePackageId } from '../u/u.npm.ts';
import { isDenoSpecifier, parseDenoSpecifier, unwrapViteId } from '../u/u.specifier.ts';
import { DenoLoaderResolver, type DenoLoaderResolverInstance } from './u.loader.ts';
import { resolveNpmPath } from './u.npmPath.ts';
import { resolveViteSpecifier } from './u.vite.ts';

type ResolveOptions = NonNullable<Parameters<PluginContext['resolve']>[2]>;

export function createResolvePlugin(
  cache: t.DenoCache,
  deps: t.ResolveDeps,
  options: t.ViteTransport.DenoPluginOptions = {},
) {
  let root = Path.cwd();
  let browserIds = false;
  let transportCacheDir = '';
  let loaderConfigBaseDir = root;
  let loaderConfigPath = hasConfigPath(options.configPath) ? options.configPath : undefined;
  let loaderResolver: Promise<DenoLoaderResolverInstance> | undefined;

  const resolveLoaderConfigPath = async () => {
    if (hasConfigPath(loaderConfigPath)) return loaderConfigPath;

    const discovery = options.configDiscovery ?? 'workspace';
    if (discovery === 'workspace') {
      const workspace = await DenoFile.nearest(
        loaderConfigBaseDir,
        (e) => Array.isArray(e.file.workspace),
      );
      if (workspace?.path) return loaderConfigPath = workspace.path;
    }

    return loaderConfigPath = await wrangle.localConfigPath(loaderConfigBaseDir);
  };

  const getLoaderResolver = async () => {
    const configPath = await resolveLoaderConfigPath();
    return await (loaderResolver ??= DenoLoaderResolver.create({
      configPath,
      noLock: true,
    }).catch((error) => {
      loaderResolver = undefined;
      throw error;
    }));
  };

  const pluginDeps = {
    ...deps,
    async resolveLoader(id: string, referrer: string | undefined, cwd: string) {
      if (deps.resolveLoader) return await deps.resolveLoader(id, referrer, cwd);
      const active = await getLoaderResolver();
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
      loaderConfigBaseDir = Path.normalize(envDir);
      loaderConfigPath = hasConfigPath(options.configPath) ? options.configPath : undefined;
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
        const importerForResolve = await resolveLoaderConfigPath();
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
        const cached = cache.get(parsed.resolved);
        return await loadDenoModule(resolvedId, cached?.dependencies ?? [], {
          browserIds,
          sourceSpecifier: cached?.kind === 'esm' ? cached.specifier : undefined,
          transformCacheDir: transportCacheDir,
          async load(specifier) {
            const active = await getLoaderResolver();
            return await active.load(specifier);
          },
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
function hasConfigPath(value: string | undefined): value is string {
  return Is.str(value) && value.trim().length > 0;
}

const wrangle = {
  async localConfigPath(baseDir: string) {
    const json = Path.join(baseDir, 'deno.json');
    if (await Fs.exists(json)) return json;

    const jsonc = Path.join(baseDir, 'deno.jsonc');
    if (await Fs.exists(jsonc)) return jsonc;

    return json;
  },
} as const;
