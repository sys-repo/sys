import { Denofile, Fs, R, type t } from './common.ts';

type E = {
  exists: boolean;
  module: string;
  config: t.StringPath;
  aliases: t.ViteAlias[];
};

/**
 * Configuration helpers for performing module-resolution over a `deno.json` workspace.
 */
export const workspace: t.ViteConfigWorkspaceFactory = async (input, options = {}) => {
  const { walkup = true } = options;
  const base = await Denofile.workspace(input, { walkup });
  const aliases = await wrangle.aliases(Fs.Path.dirname(base.path), base.paths);
  return {
    ...base,

    /**
     * Workspace module resolution helpers.
     */
    resolution: {
      aliases,
      toMap() {
        return aliases.reduce((acc: any, alias) => {
          acc[String(alias.find)] = alias.replacement;
          return acc;
        }, {});
      },
    },
  };
};

/**
 * Helpers
 */

const wrangle = {
  async aliases(base: t.StringDirPath, workspacePaths: t.StringPath[]) {
    const exports = await wrangle.modules(base, workspacePaths);
    return exports.reduce<t.ViteAlias[]>((acc, next) => {
      acc.push(...next.aliases);
      return acc;
    }, []);
  },

  async modules(base: t.StringDirPath, workspacePaths: t.StringPath[]) {
    const wait = workspacePaths.map((dir) => wrangle.exports(base, dir));
    const res = await Array.fromAsync(wait);
    return res
      .filter((item) => item.exists)
      .filter((item) => item.module) // NB: filter out unmamed modules.
      .filter((item) => item.aliases.length > 0); // Filter out modules that don't provide exports.
  },

  async exports(base: t.StringPath, dir: t.StringPath) {
    const config = Fs.join(base, dir, 'deno.json');
    const { exists, json } = await Denofile.load(config);
    const module = json?.name ?? '';
    const list: t.ViteAlias[] = [];
    if (json?.exports) {
      Object.entries(json.exports).forEach(([key, value]) => {
        const find = Fs.join(module, key);
        const replacement = Fs.join(base, dir, value);
        list.push({ find, replacement });
      });
    }
    const aliases = wrangle.sortedAliases(list);
    const res: E = { module, config, aliases, exists };
    return res;
  },

  sortedAliases(list: t.ViteAlias[]) {
    /**
     * NB: ordered longest → shortest so that the most specific
     *     export-names are matched first so that more general names
     *     are not prematurely matched and returned by Vite/Rollup.
     */
    const length = (alias: t.ViteAlias) => String(alias.find).length;
    const compare = (a: t.ViteAlias, b: t.ViteAlias) => length(b) - length(a);
    return R.sort<t.ViteAlias>(compare, list);
  },
} as const;
