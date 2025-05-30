/**
 * @module
 */
import { DenoFile, Fs, Path, R, type t } from './common.ts';
import { Log } from './u.log.ts';

type E = {
  exists: boolean;
  pkg: string;
  config: t.StringPath;
  aliases: t.ViteAlias[];
};

/**
 * Configuration helpers for performing module-resolution over a `deno.json` workspace.
 */
export const workspace: t.ViteConfigLib['workspace'] = async (options = {}) => {
  const { walkup = true, filter } = options;
  const base = await DenoFile.workspace(options.denofile, { walkup });
  const aliases = await wrangle.aliases(Path.dirname(base.file), base.children, filter);

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
    toString: (options) => Log.toString(api, options),
    log: (options) => console.info(api.toString(options)),
  };

  return api;
};

/**
 * Helpers
 */
const wrangle = {
  async aliases(base: t.StringDir, children: t.DenoWorkspaceChild[], filter?: t.WorkspaceFilter) {
    const exports = await wrangle.modules(base, children, filter);
    return exports.reduce<t.ViteAlias[]>((acc, next) => {
      acc.push(...next.aliases);
      return acc;
    }, []);
  },

  async modules(base: t.StringDir, children: t.DenoWorkspaceChild[], filter?: t.WorkspaceFilter) {
    const wait = children.map((child) => wrangle.exports(base, child.path.dir, filter));
    const res = await Array.fromAsync(wait);
    return res
      .filter((item) => item.exists)
      .filter((item) => item.pkg) // NB: filter out unnamed modules.
      .filter((item) => item.aliases.length > 0); // Filter out modules that don't provide exports.
  },

  async exports(base: t.StringPath, dir: t.StringPath, filter?: t.WorkspaceFilter) {
    const config = Fs.join(base, dir, 'deno.json');
    const { exists, data } = await DenoFile.load(config);
    const pkg = data?.name ?? '';
    const list: t.ViteAlias[] = [];
    if (data?.exports) {
      Object.entries(data.exports).forEach(([key, value]) => {
        const find = Fs.join(pkg, key);
        const replacement = Fs.join(base, dir, value);
        list.push({ find, replacement });
      });
    }

    const aliases = wrangle.sortedAliases(list).filter((alias) => {
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
