import { Path, type t } from '../common.ts';
import { repairConcreteRemoteAuthorityDelimiter, toDenoSpecifier } from '../u/u.specifier.ts';
import { trace } from './u.trace.ts';

export async function resolveWithLoader(
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

export function adaptLoaderResolution(
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

export function adaptCachedResolution(
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

export function loaderReferrerFromDenoImporter(parentId: string, parent: string) {
  return isRemoteLike(parentId)
    ? repairConcreteRemoteAuthorityDelimiter(parentId)
    : pathToFileUrl(parent);
}

export function loaderReferrerFromViteImporter(importer: string | undefined, root: string) {
  if (!importer) return;
  if (importer.startsWith('file://')) return importer;
  if (isRemoteLike(importer)) return repairConcreteRemoteAuthorityDelimiter(importer);
  if (Path.Is.absolute(importer)) return pathToFileUrl(importer);
  return pathToFileUrl(Path.join(root, importer));
}

export function isRemoteLike(specifier: string) {
  return (
    specifier.startsWith('http://') ||
    specifier.startsWith('https://') ||
    specifier.startsWith('jsr:')
  );
}

/**
 * Helpers:
 */
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
