import { Path, Process, type t } from '../common.ts';
import { toViteNpmSpecifier } from '../u/u.npm.ts';
import { isDenoSpecifier, parseDenoSpecifier, toDenoSpecifier } from '../u/u.specifier.ts';
import {
  adaptCachedResolution,
  adaptLoaderResolution,
  isRemoteLike,
  loaderReferrerFromDenoImporter,
  loaderReferrerFromViteImporter,
  resolveWithLoader,
} from './u.loaderAdapter.ts';
import { trace } from './u.trace.ts';

export async function resolveViteSpecifier(
  id: string,
  cache: t.DenoCache,
  posixRoot: string,
  importer?: string,
  deps: t.ResolveDeps = {
    invoke: Process.invoke,
  },
) {
  const root = Path.normalize(posixRoot);
  const sourceId = id;

  if (importer && isDenoSpecifier(importer)) {
    const { id: parentId, resolved: parent } = parseDenoSpecifier(importer);
    trace.resolve('importer.request', { sourceId, importer, parentId, parent });
    const cached = cache.get(parent);
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
        if (id.startsWith('npm:')) return toViteNpmSpecifier(id);
        if (found.localPath && found.loader && isRemoteLike(id)) {
          const existing = cache.get(found.localPath);
          if (existing?.kind === 'esm') {
            cache.set(existing.id, existing);
            cache.set(id, existing);
            return toDenoSpecifier(existing.loader ?? found.loader, id, existing.id);
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

  return;
}
