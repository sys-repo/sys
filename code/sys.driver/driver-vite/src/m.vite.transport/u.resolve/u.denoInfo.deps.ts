import type { t } from '../common.ts';
import { isRemoteLike } from './u.loaderAdapter.ts';
import { isResolveError, isResolveInfoModuleEsm } from './u.denoInfo.is.ts';

export function normalizeDependencies(
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
