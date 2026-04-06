import { Deps, type t } from './common.ts';

/**
 * Apply Deno imports onto a target `deno.json` file.
 */
export const applyDeno: t.DepsLib['applyDeno'] = async (
  path: t.StringPath | undefined,
  deps?: t.Dep[],
): Promise<t.DenoDeps.ApplyResult> => await Deps.applyDeno(path, deps);
