import { DenoFile, Fs, type t } from './common.ts';

type ModuleExports = {
  exists: boolean;
  pkg: string;
  config: t.StringPath;
  aliases: t.ViteAlias[];
};

/**
 * Workspace alias helpers.
 */
export const Aliases = {
  async list(
    base: t.StringDir,
    children: t.DenoFile.Workspace.Child[],
    filter?: t.WorkspaceFilter,
  ) {
    const modules = await Aliases.modules(base, children, filter);
    return modules.reduce<t.ViteAlias[]>((acc, next) => {
      acc.push(...next.aliases);
      return acc;
    }, []);
  },

  async modules(
    base: t.StringDir,
    children: t.DenoFile.Workspace.Child[],
    filter?: t.WorkspaceFilter,
  ) {
    const wait = children.map((child) => Aliases.exports(base, child.path.dir, filter));
    const res = await Promise.all(wait);
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

    const aliases = Aliases.sorted(list).filter((alias) => {
      if (!filter) return true;
      const payload = Aliases.filterArgs(pkg, alias);
      return filter?.(payload);
    });

    const res: ModuleExports = { pkg, config, aliases, exists };
    return res;
  },

  sorted(list: t.ViteAlias[]): t.ViteAlias[] {
    /**
     * NB: ordered longest → shortest so that the most specific
     *     export-names are matched first so that more general names
     *     are not prematurely matched and returned by Vite/Rollup.
     */
    const length = (alias: t.ViteAlias) => String(alias.find).length;
    return [...list].sort((a, b) => length(b) - length(a));
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
