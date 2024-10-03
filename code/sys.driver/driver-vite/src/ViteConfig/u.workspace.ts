import { Denofile, Fs, type t } from './common.ts';

/**
 * Configuration helpers for performing module-resolution over a `deno.json` workspace.
 */
export const workspace: t.ViteConfigWorkspaceFactory = async (input, options = {}) => {
  const { walkup = true } = options;
  const base = await Denofile.workspace(input, { walkup });

  const alias = await wrangle.alias(Fs.Path.dirname(base.path), base.paths);
  const resolution: t.ViteDenoWorkspaceResolution = { alias };

  return {
    ...base,
    resolution,
  };
};

/**
 * Helpers
 */
type WorkspaceExports = {
  exists: boolean;
  module: string;
  config: t.StringPath;
  alias: Record<string, t.StringPath>;
};

const wrangle = {
  async alias(base: t.StringDirPath, workspacePaths: t.StringPath[]) {
    const exports = await wrangle.modulesExports(base, workspacePaths);
    let res: t.ViteDenoWorkspaceResolution['alias'] = {};
    exports.forEach((item) => (res = { ...res, ...item.alias }));
    return res;
  },

  async modulesExports(base: t.StringDirPath, workspacePaths: t.StringPath[]) {
    const wait = workspacePaths.map((dir) => wrangle.moduleExports(base, dir));
    const res = await Array.fromAsync(wait);
    return res
      .filter((item) => item.exists)
      .filter((item) => item.module) // NB: filter out unmamed modules.
      .filter((item) => Object.keys(item.alias).length > 0); // Filter out modules that don't provide exports.
  },

  async moduleExports(base: t.StringPath, dir: t.StringPath) {
    const config = Fs.join(base, dir, 'deno.json');
    const { exists, json } = await Denofile.load(config);
    const module = json?.name ?? '';

    const alias = {};
    if (json?.exports) {
      Object.entries(json.exports).forEach(([key, value]) => {
        const field = Fs.join(module, key);
        const target = Fs.join(base, dir, value);
        (alias as any)[field] = target;
      });
    }

    const res: WorkspaceExports = { module, config, alias, exists };
    return res;
  },
} as const;
