import { Deps, type t } from './common.ts';

/**
 * Write canonical dependency YAML back to a deps.yaml file.
 */
export const applyYaml: t.DenoDeps.Lib['applyYaml'] = async (
  path: t.StringPath | undefined,
  deps?: t.DenoDeps.Dep[],
  options?: t.DenoDeps.YamlOptions,
): Promise<t.DenoDeps.Apply.YamlResult> =>
  await Deps.applyYaml(path, deps, wrangle.yamlOptions(options));

/**
 * Helpers:
 */
const wrangle = {
  yamlOptions(options?: t.DenoDeps.YamlOptions): t.EsmDeps.YamlOptions | undefined {
    if (!options) return undefined;
    if (!options.groupBy) return {};

    return {
      groupBy: ({ entry, target, group }) => options.groupBy?.({ dep: entry, target, group }),
    };
  },
} as const;
