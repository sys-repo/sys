import { type t } from './common.ts';
import { applyDeno } from './u.apply.ts';
import { applyPackage } from './u.applyPackage.ts';
import { applyYaml } from './u.applyYaml.ts';

/**
 * Apply canonical deps to deps.yaml and projected Deno files together.
 */
export async function applyFiles(
  input: {
    readonly depsPath?: t.StringPath;
    readonly denoFilePath?: t.StringPath;
    readonly packageFilePath?: t.StringPath;
    readonly yaml?: t.DepsYamlOptions;
  },
  deps?: t.Dep[],
): Promise<t.DenoDeps.ApplyFilesResult> {
  const yaml = await applyYaml(input.depsPath, deps, input.yaml);
  const deno = await applyDeno(input.denoFilePath, deps);
  const pkg = await applyPackage(input.packageFilePath, deps);
  return { yaml, deno, package: pkg };
}
