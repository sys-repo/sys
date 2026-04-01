import { Deps, type t } from './common.ts';

/**
 * Write canonical dependency YAML back to a deps.yaml file.
 */
export const applyYaml: t.DepsLib['applyYaml'] = async (
  path: t.StringPath | undefined,
  deps?: t.Dep[],
  options?: t.DepsYamlOptions,
): Promise<t.DenoDeps.ApplyYamlResult> =>
  await Deps.applyYaml(path, deps, wrangle.yamlOptions(options));

/**
 * Helpers:
 */
const wrangle = {
  yamlOptions(options?: t.DepsYamlOptions): t.EsmDeps.YamlOptions | undefined {
    if (!options) return undefined;
    if (!options.groupBy) return {};

    return {
      groupBy: ({ entry, target, group }) => options.groupBy?.({ dep: entry, target, group }),
    };
  },
} as const;
