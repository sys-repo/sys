import { type t } from './common.ts';
import { apply } from './u.apply.ts';
import { applyYaml } from './u.applyYaml.ts';

/**
 * Apply canonical deps to deps.yaml and projected Deno files together.
 */
export async function applyFiles(
  input: {
    readonly depsPath?: t.StringPath;
    readonly denoFilePath?: t.StringPath;
    readonly yaml?: t.DepsYamlOptions;
  },
  deps?: t.Dep[],
): Promise<t.DenoDeps.ApplyFilesResult> {
  const yaml = await applyYaml(input.depsPath, deps, input.yaml);
  const deno = await apply(input.denoFilePath, deps);
  return { yaml, deno };
}
