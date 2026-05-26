import { type t } from './common.ts';
import { applyDeno } from './u.apply.ts';
import { applyPackage } from './u.applyPackage.ts';
import { applyYaml } from './u.applyYaml.ts';

/**
 * Apply canonical deps to deps.yaml and projected files together.
 */
export async function applyFiles(
  input: {
    readonly depsPath?: t.StringPath;
    readonly denoFilePath?: t.StringPath;
    readonly packageFilePath?: t.StringPath;
    readonly yaml?: t.EsmDeps.ApplyFilesYamlOptions;
    readonly packageJson?: t.EsmDeps.PackageJsonPolicy;
  },
  entries?: t.EsmDeps.Entry[],
): Promise<t.EsmDeps.ApplyFilesResult> {
  const packageJson = input.packageJson;
  const yamlOptions = packageJson === undefined ? input.yaml : { ...input.yaml, packageJson };
  const yaml = await applyYaml(input.depsPath, entries, yamlOptions);
  const deno = await applyDeno(input.denoFilePath, entries);
  const pkg = await applyPackage(input.packageFilePath, entries, { packageJson });
  return pkg ? { yaml, deno, package: pkg } : { yaml, deno };
}
