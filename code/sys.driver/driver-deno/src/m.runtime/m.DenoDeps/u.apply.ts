import { Deps, type t } from './common.ts';

/**
 * Apply Deno imports onto a target `deno.json` file.
 */
export const applyDeno: t.DenoDeps.Lib['applyDeno'] = async (
  path: t.StringPath | undefined,
  deps?: t.DenoDeps.Dep[],
): Promise<t.DenoDeps.Apply.DenoResult> => await Deps.applyDeno(path, deps);
