import { Fs, type t } from './common.ts';
import { toYaml } from './u.toYaml.ts';

const DEFAULT_DEPS_PATH = './deps.yaml';

/**
 * Write canonical dependency YAML back to a deps.yaml file.
 */
export async function applyYaml(
  path: t.StringPath | undefined,
  entries?: t.EsmDeps.Entry[],
  options?: t.EsmDeps.YamlOptions,
): Promise<t.EsmDeps.ApplyYamlResult> {
  const depsFilePath = path ?? DEFAULT_DEPS_PATH;
  const yaml = toYaml(entries ?? [], options);
  await Fs.write(depsFilePath, yaml.text);
  return { depsFilePath, yaml };
}
