import { Deps, type t } from './common.ts';

/**
 * Apply package dependencies onto a target `package.json` file.
 */
export const applyPackage: t.DenoDeps.Lib['applyPackage'] = async (
  path: t.StringPath | undefined,
  deps?: t.DenoDeps.Dep[],
): Promise<t.DenoDeps.Apply.PackageResult | undefined> => await Deps.applyPackage(path, deps);
