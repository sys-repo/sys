import { Perf } from '../../common/u.perf.ts';
import { Fs, Path, type t } from '../common.ts';
import { type LoadResponse, RequestedModuleType, Workspace } from '@deno/loader';
import { TransformCache } from './u.cache.ts';
import { toViteNpmSpecifier } from './u.npm.ts';
import { canonicalRemoteSpecifier, parseDenoSpecifier, toDenoSpecifier } from './u.specifier.ts';

export type DenoLoadResult = string | t.DenoTransformedModule;

export async function loadDenoModule(
  id: string,
  dependencies: readonly t.DenoDependency[] = [],
  options: {
    readonly browserIds?: boolean;
    readonly sourceSpecifier?: string;
    readonly transformCacheDir?: string;
    readonly load?: (specifier: string) => Promise<LoadResponse>;
  } = {},
): Promise<DenoLoadResult> {
  const parsed = parseDenoSpecifier(id);
  const loader = parsed.loader as t.DenoLoader;
  const { resolved } = parsed;
  const end = Perf.section('transport.loadDenoModule', {
    id,
    loader,
    dependencies: dependencies.length,
    browserIds: options.browserIds ?? false,
  }, { level: 3 });
  if (isConcreteRemoteSpecifier(resolved)) {
    const loaded = await loadWithDenoLoader(resolved, loader, resolved, options.load);
    const code = rewriteResolvedImports(loaded.code, dependencies, options);
    const result = { code, map: loaded.map } as const;
    end({ transform: true, remote: true, bytes: code.length, map: loaded.map?.length ?? 0 });
    return result;
  }

  const original = (await Fs.readText(resolved)).data ?? '';
  const content = rewriteResolvedImports(original, dependencies, options);

  if (loader === 'JavaScript') {
    end({ transform: false, bytes: content.length });
    return content;
  }
  if (loader === 'Json') {
    const code = `export default ${content}`;
    end({ transform: false, bytes: code.length });
    return code;
  }

  const cache = TransformCache.plan({
    cacheDir: options.transformCacheDir,
    browserIds: options.browserIds ?? false,
    id: parsed.id,
    resolved,
    loader,
    source: original,
    dependencies,
  });
  if (cache.kind === 'ready') {
    const cached = await TransformCache.read(cache.plan);
    if (cached.kind === 'hit') {
      Perf.log('transport.transform.cache.hit', { id: parsed.id, loader, key: cache.plan.key }, {
        level: 2,
        dedupeKey: `transport.transform.cache.hit:${cache.plan.key}`,
      });
      end({ transform: true, cache: 'hit', bytes: cached.value.code.length });
      return cached.value;
    }
    if (cached.kind === 'invalid') {
      Perf.log('transport.transform.cache.validationFailed', {
        id: parsed.id,
        loader,
        key: cache.plan.key,
        reason: cached.reason,
      }, {
        level: 1,
        dedupeKey: `transport.transform.cache.validationFailed:${cache.plan.key}:${cached.reason}`,
      });
    } else {
      Perf.log('transport.transform.cache.miss', { id: parsed.id, loader, key: cache.plan.key }, {
        level: 2,
        dedupeKey: `transport.transform.cache.miss:${cache.plan.key}`,
      });
    }
  } else {
    Perf.log('transport.transform.cache.bypass', { id: parsed.id, loader, reason: cache.reason }, {
      level: 2,
      dedupeKey: `transport.transform.cache.bypass:${parsed.id}:${loader}:${cache.reason}`,
    });
  }

  const transformed = await transformModule(
    content,
    loader,
    resolved,
    options.sourceSpecifier ?? parsed.id,
    options.load,
  );
  const code = rewriteResolvedImports(transformed.code, dependencies, options);
  const result = {
    code,
    map: transformed.map,
  } as const;
  if (cache.kind === 'ready') {
    await TransformCache.write(cache.plan, result);
    Perf.log('transport.transform.cache.write', { id: parsed.id, loader, key: cache.plan.key }, {
      level: 2,
      dedupeKey: `transport.transform.cache.write:${cache.plan.key}`,
    });
  }
  end({ transform: true, cache: cache.kind === 'ready' ? 'write' : 'bypass', bytes: code.length });
  return result;
}

export function denoLoaderLoadSpecifier(id: string, sourcefile: string) {
  const remote = canonicalRemoteSpecifier(id);
  if (isConcreteRemoteSpecifier(remote) && !hasExplicitModuleExtension(sourcefile)) return remote;
  return Path.toFileUrl(sourcefile).href;
}

export function mediaTypeToLoader(media: string) {
  switch (media) {
    case 'JSX':
      return 'jsx';
    case 'JavaScript':
      return 'js';
    case 'Json':
      return 'json';
    case 'TSX':
      return 'tsx';
    case 'TypeScript':
      return 'ts';
    default:
      return 'js';
  }
}

/**
 * Helpers:
 */
async function transformModule(
  _content: string,
  loader: t.DenoLoader,
  sourcefile: string,
  id: string,
  load?: (specifier: string) => Promise<LoadResponse>,
) {
  const specifier = denoLoaderLoadSpecifier(id, sourcefile);
  return await loadWithDenoLoader(specifier, loader, sourcefile, load);
}

async function loadWithDenoLoader(
  specifier: string,
  loader: t.DenoLoader,
  sourcefile: string,
  load = wrangle.load,
) {
  const end = Perf.section('transport.transform.denoLoader', { loader, sourcefile, specifier }, {
    level: 3,
    thresholdMs: 10 as t.Msecs,
  });
  const result = await load(specifier);

  if (result.kind === 'external') {
    end({ ok: false, external: true });
    throw new Error(`Deno loader returned external module for transform: ${sourcefile}`);
  }

  const code = wrangle.decode(result.code);
  const map = result.sourceMap ? wrangle.decode(result.sourceMap) : null;
  end({ bytes: code.length, map: map?.length ?? 0 });
  return { code, map } as const;
}

const wrangle = {
  loader: (() => {
    let current: ReturnType<Workspace['createLoader']> | undefined;
    return () => current ??= new Workspace().createLoader();
  })(),

  async load(specifier: string) {
    const denoLoader = await wrangle.loader();
    return await denoLoader.load(specifier, RequestedModuleType.Default);
  },

  decode(input: Uint8Array) {
    return new TextDecoder().decode(input);
  },
} as const;

function rewriteResolvedImports(
  content: string,
  dependencies: readonly t.DenoDependency[],
  options: {
    readonly browserIds?: boolean;
  },
): string {
  return dependencies.reduce((next, dependency) => {
    const target = resolvedImportSpecifier(dependency, options);
    if (target === dependency.specifier) return next;

    const sources = new Set<string>([dependency.specifier]);
    if (dependency.specifier.startsWith('npm:')) {
      sources.add(toViteNpmSpecifier(dependency.specifier));
    }

    return [...sources].reduce(
      (text, source) => rewriteImportSpecifier(text, source, target),
      next,
    );
  }, content);
}

function resolvedImportSpecifier(
  dependency: t.DenoDependency,
  options: {
    readonly browserIds?: boolean;
  },
) {
  const { resolvedSpecifier: specifier, localPath } = dependency;
  if (localPath && dependency.loader && isRemoteLike(specifier)) {
    const sourceId = canonicalRemoteSpecifier(dependency.sourceSpecifier ?? specifier);
    return options.browserIds
      ? toBrowserDenoSpecifier(dependency.loader, sourceId, localPath)
      : toDenoSpecifier(dependency.loader, sourceId, localPath);
  }
  if (specifier.startsWith('file://')) return Path.fromFileUrl(specifier);
  if (specifier.startsWith('npm:')) return specifier;
  return specifier;
}

function isRemoteLike(specifier: string) {
  return (
    specifier.startsWith('http://') ||
    specifier.startsWith('https://') ||
    specifier.startsWith('http:/') ||
    specifier.startsWith('https:/') ||
    specifier.startsWith('jsr:')
  );
}

function isConcreteRemoteSpecifier(specifier: string) {
  return specifier.startsWith('http://') || specifier.startsWith('https://');
}

function hasExplicitModuleExtension(sourcefile: string) {
  return Path.extname(sourcefile).length > 0;
}

function toBrowserDenoSpecifier(loader: t.DenoLoader, id: string, resolved: string) {
  const specifier = toDenoSpecifier(loader, id, resolved);
  return `/@id/${specifier.replace('\0', '__x00__')}`;
}

function rewriteImportSpecifier(content: string, source: string, target: string) {
  return content
    .replaceAll(`from '${source}'`, `from '${target}'`)
    .replaceAll(`from "${source}"`, `from "${target}"`)
    .replaceAll(`import('${source}')`, `import('${target}')`)
    .replaceAll(`import("${source}")`, `import("${target}")`);
}
