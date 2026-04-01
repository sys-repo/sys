import { Deps, type t } from './common.ts';

/**
 * Apply canonical deps to deps.yaml and projected Deno files together.
 */
export const applyFiles: t.DepsLib['applyFiles'] = async (
  input: {
    readonly depsPath?: t.StringPath;
    readonly denoFilePath?: t.StringPath;
    readonly packageFilePath?: t.StringPath;
    readonly yaml?: t.DepsYamlOptions;
  },
  deps?: t.Dep[],
): Promise<t.DenoDeps.ApplyFilesResult> => await Deps.applyFiles(wrangle.input(input), deps);

/**
 * Helpers:
 */
const wrangle = {
  input(input: {
    readonly depsPath?: t.StringPath;
    readonly denoFilePath?: t.StringPath;
    readonly packageFilePath?: t.StringPath;
    readonly yaml?: t.DepsYamlOptions;
  }): {
    readonly depsPath?: t.StringPath;
    readonly denoFilePath?: t.StringPath;
    readonly packageFilePath?: t.StringPath;
    readonly yaml?: t.EsmDeps.YamlOptions;
  } {
    if (!input.yaml) {
      return {
        depsPath: input.depsPath,
        denoFilePath: input.denoFilePath,
        packageFilePath: input.packageFilePath,
      };
    }

    if (!input.yaml.groupBy) {
      return {
        depsPath: input.depsPath,
        denoFilePath: input.denoFilePath,
        packageFilePath: input.packageFilePath,
        yaml: {},
      };
    }

    return {
      depsPath: input.depsPath,
      denoFilePath: input.denoFilePath,
      packageFilePath: input.packageFilePath,
      yaml: {
        groupBy: ({ entry, target, group }) => input.yaml?.groupBy?.({ dep: entry, target, group }),
      },
    };
  },
} as const;
