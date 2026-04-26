import { CompositeHash, Fs, Json, Path } from '../common/libs.ts';
import { pkg } from '../pkg.ts';
import type { t } from './common.ts';
import { canonicalRemoteSpecifier } from './u.specifier.ts';

const CACHE_VERSION = 'vite.transport.transform.v1';
const ESBUILD_VERSION = '0.28.0';
const SUPPORTED_LOADERS = new Set<t.DenoLoader>(['JSX', 'TSX', 'TypeScript']);

type CachePlanArgs = {
  readonly cacheDir?: string;
  readonly browserIds: boolean;
  readonly id: string;
  readonly resolved: string;
  readonly loader: t.DenoLoader;
  readonly source: string;
  readonly dependencies: readonly t.DenoDependency[];
};

export type TransformCachePlan = {
  readonly key: string;
  readonly path: string;
};

export type TransformCacheResult =
  | { readonly kind: 'bypass'; readonly reason: string }
  | { readonly kind: 'ready'; readonly plan: TransformCachePlan };

export type TransformCacheReadResult =
  | { readonly kind: 'hit'; readonly value: t.DenoTransformedModule }
  | { readonly kind: 'miss' }
  | { readonly kind: 'invalid'; readonly reason: string };

export const TransformCache = {
  plan(args: CachePlanArgs): TransformCacheResult {
    if (!args.browserIds) return { kind: 'bypass', reason: 'non-browser' };
    if (!args.cacheDir) return { kind: 'bypass', reason: 'no-cache-dir' };
    if (!SUPPORTED_LOADERS.has(args.loader)) return { kind: 'bypass', reason: 'unsupported-loader' };

    const sourceId = wrangle.canonicalSourceId(args.id);
    if (!sourceId) return { kind: 'bypass', reason: 'non-remote-source' };
    const materialized = Path.normalize(args.resolved);
    if (Path.resolve(materialized) !== materialized) return { kind: 'bypass', reason: 'non-materialized-source' };

    const sourceHash = wrangle.digest(args.source);
    const depsHash = wrangle.rewriteDigest(args.dependencies, args.browserIds);
    const key = wrangle.digest(Json.stringify({
      version: CACHE_VERSION,
      driver: pkg.version,
      esbuild: ESBUILD_VERSION,
      loader: args.loader,
      sourceId,
      sourceHash,
      depsHash,
    }));
    const dir = wrangle.dir(args.cacheDir);
    return {
      kind: 'ready',
      plan: { key, path: Path.join(dir, `${key}.json`) },
    };
  },

  async read(plan: TransformCachePlan): Promise<TransformCacheReadResult> {
    if (!(await Fs.exists(plan.path))) return { kind: 'miss' };

    try {
      const data = (await Fs.readJson<t.DenoTransformedModule>(plan.path)).data;
      if (!data || typeof data.code !== 'string' || !(typeof data.map === 'string' || data.map === null)) {
        await Fs.remove(plan.path, { log: false });
        return { kind: 'invalid', reason: 'malformed-entry' };
      }
      return { kind: 'hit', value: data };
    } catch {
      await Fs.remove(plan.path, { log: false });
      return { kind: 'invalid', reason: 'unreadable-entry' };
    }
  },

  async write(plan: TransformCachePlan, value: t.DenoTransformedModule) {
    await Fs.ensureDir(Path.dirname(plan.path));
    await Fs.writeJson(plan.path, value);
  },
} as const;

const wrangle = {
  dir(cacheDir: string) {
    return Path.join(Path.resolve(cacheDir), '.sys-driver-vite', 'transport');
  },

  canonicalSourceId(id: string) {
    const canonical = wrangle.isRemoteLike(id) ? canonicalRemoteSpecifier(id) : '';
    return wrangle.isImmutableRemote(canonical) ? canonical : '';
  },

  rewriteDigest(dependencies: readonly t.DenoDependency[], browserIds: boolean) {
    const pairs = dependencies
      .map((dependency) => [dependency.specifier, wrangle.rewriteTarget(dependency, browserIds)] as const)
      .sort(([aSpec, aTarget], [bSpec, bTarget]) => aSpec.localeCompare(bSpec) || aTarget.localeCompare(bTarget));
    return wrangle.digest(Json.stringify(pairs));
  },

  rewriteTarget(dependency: t.DenoDependency, browserIds: boolean) {
    const { resolvedSpecifier: specifier, localPath } = dependency;
    if (localPath && dependency.loader && wrangle.isRemoteLike(specifier)) {
      const sourceId = canonicalRemoteSpecifier(specifier);
      return browserIds
        ? `/@id/${`\0deno::${dependency.loader}::${sourceId}::${Path.normalize(localPath)}`.replace('\0', '__x00__')}`
        : `\0deno::${dependency.loader}::${sourceId}::${Path.normalize(localPath)}`;
    }
    if (specifier.startsWith('file://')) return Path.fromFileUrl(specifier);
    return specifier;
  },

  digest(value: string) {
    return CompositeHash.builder().add('value', value).digest;
  },

  isRemoteLike(specifier: string) {
    return (
      specifier.startsWith('http://') ||
      specifier.startsWith('https://') ||
      specifier.startsWith('https:/') ||
      specifier.startsWith('jsr:')
    );
  },

  isImmutableRemote(specifier: string) {
    return specifier.startsWith('http://') || specifier.startsWith('https://');
  },
} as const;
