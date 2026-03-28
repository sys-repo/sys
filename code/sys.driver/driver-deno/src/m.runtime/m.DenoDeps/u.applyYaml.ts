import { D, Fs, type t } from './common.ts';
import { toYaml } from './m.Deps.ts';

/**
 * Write canonical dependency YAML back to a deps.yaml file.
 */
export async function applyYaml(
  path: t.StringPath | undefined,
  deps?: t.Dep[],
  options?: t.DepsYamlOptions,
): Promise<t.DenoDeps.ApplyYamlResult> {
  const depsFilePath = path ?? D.depsFilePath;
  const yaml = toYaml(deps ?? [], options);
  await Fs.write(depsFilePath, yaml.text);
  return { depsFilePath, yaml };
}
