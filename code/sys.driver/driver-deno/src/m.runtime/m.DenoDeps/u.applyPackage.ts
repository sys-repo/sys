import { Deps, type t } from './common.ts';

/**
 * Apply package dependencies onto a target `package.json` file.
 */
export const applyPackage: t.DepsLib['applyPackage'] = async (
  path: t.StringPath | undefined,
  deps?: t.Dep[],
): Promise<t.DenoDeps.ApplyPackageResult | undefined> => await Deps.applyPackage(path, deps);
