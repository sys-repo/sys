import { Denofile, Fs, Path, R, type t } from './common.ts';
import { Log } from './u.ts';

type E = {
  exists: boolean;
  pkg: string;
  config: t.StringPath;
  aliases: t.ViteAlias[];
};

/**
 * Configuration helpers for performing module-resolution over a `deno.json` workspace.
 */
export const workspace: t.ViteConfigWorkspaceFactory = async (options = {}) => {
  const { walkup = true, filter } = options;
  const base = await Denofile.workspace(options.denofile, { walkup });
  const baseDir = Path.dirname(base.path);
  const aliases = await wrangle.aliases(baseDir, base.paths, filter);

  const api: t.ViteDenoWorkspace = {
    ...base,
    filter,
    aliases,
    toAliasMap() {
      return aliases.reduce((acc: any, alias) => {
        acc[String(alias.find)] = alias.replacement;
        return acc;
      }, {});
    },
    toString(options = {}) {
      return Log.Workspace.toString(api, options);
    },
  };

  return api;
};

/**
 * Helpers
 */
const wrangle = {
  async aliases(
    baseDir: t.StringDirPath,
    workspacePaths: t.StringPath[],
    filter?: t.WorkspaceFilter,
  ) {
    const exports = await wrangle.modules(baseDir, workspacePaths, filter);
    return exports.reduce<t.ViteAlias[]>((acc, next) => {
      acc.push(...next.aliases);
      return acc;
    }, []);
  },

  async modules(
    baseDir: t.StringDirPath,
    workspacePaths: t.StringPath[],
    filter?: t.WorkspaceFilter,
  ) {
    const wait = workspacePaths.map((dir) => wrangle.exports(baseDir, dir, filter));
    const res = await Array.fromAsync(wait);
    return res
      .filter((item) => item.exists)
      .filter((item) => item.pkg) // NB: filter out unmamed modules.
      .filter((item) => item.aliases.length > 0); // Filter out modules that don't provide exports.
  },

  async exports(base: t.StringPath, dir: t.StringPath, filter?: t.WorkspaceFilter) {
    const config = Fs.join(base, dir, 'deno.json');
    const { exists, json } = await Denofile.load(config);
    const pkg = json?.name ?? '';
    const list: t.ViteAlias[] = [];
    if (json?.exports) {
      Object.entries(json.exports).forEach(([key, value]) => {
        const find = Fs.join(pkg, key);
        const replacement = Fs.join(base, dir, value);
        list.push({ find, replacement });
      });
    }

    const aliases = wrangle
      //
      .sortedAliases(list)
      .filter((alias) => {
        if (!filter) return true;
        const payload = wrangle.filterArgs(pkg, alias);
        return filter?.(payload);
      });

    const res: E = { pkg, config, aliases, exists };
    return res;
  },

  sortedAliases(list: t.ViteAlias[]): t.ViteAlias[] {
    /**
     * NB: ordered longest → shortest so that the most specific
     *     export-names are matched first so that more general names
     *     are not prematurely matched and returned by Vite/Rollup.
     */
    const length = (alias: t.ViteAlias) => String(alias.find).length;
    const compare = (a: t.ViteAlias, b: t.ViteAlias) => length(b) - length(a);
    return R.sort<t.ViteAlias>(compare, list);
  },

  filterArgs(pkg: string, alias: t.ViteAlias): t.WorkspaceFilterArgs {
    const text = String(alias.find);
    return {
      pkg,
      export: text,
      subpath: text.substring(pkg.length),
    };
  },
} as const;
