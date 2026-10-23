import { c, Cli, Str, type t } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { discoverOpenTargets, type OpenTargetEntry } from './u.openTargets.discover.ts';

type Entry = OpenTargetEntry & {
  readonly name: string;
};

export type YamlLocation = t.ServeTool.LocationYaml.Location;
export type OpenMenuPick = { cmd: 'open'; path: string };
export type OpenMenuOption = { name: string; value: OpenMenuPick };

export const OpenTargets = {
  async menuOptions(location: YamlLocation): Promise<readonly OpenMenuOption[]> {
    const roots = await OpenTargets.discover(location.dir);
    const withTreeBranches = (
      items: readonly Entry[],
      depth = 1,
    ): ReadonlyArray<{ name: string; value: OpenMenuPick }> => {
      const rows = items.map((item, index) => {
        const tree = Fmt.Tree.branch([index, items], depth);
        const base = `${tree} ${String(item.name).trimStart()}`.trimEnd();
        const files = `${item.fileCount}-${Str.plural(item.fileCount, 'file')}`;
        const suffix = c.gray(c.dim(` | ${files}`));
        return { item, base, suffix };
      });

      const width = Math.max(0, ...rows.map((row) => Cli.stripAnsi(row.base).length));
      return rows.map((row) => {
        const len = Cli.stripAnsi(row.base).length;
        const pad = ' '.repeat(Math.max(0, width - len));
        const name = ` ${row.base}${pad}${row.suffix}`.trimEnd();
        return {
          name,
          value: { cmd: 'open', path: row.item.path },
        };
      });
    };
    return withTreeBranches(roots, 1);
  },

  async discover(dir: t.StringDir): Promise<readonly Entry[]> {
    const entries = await discoverOpenTargets(dir);
    return entries.map(formatEntry);
  },
} as const;

/**
 * Helpers:
 */
function formatEntry(entry: OpenTargetEntry): Entry {
  if (!entry.path) return { ...entry, name: `${c.dim('root')}   /` };
  const label = entry.hash ? `${Fmt.hashSuffix(entry.hash)} ${entry.path}` : entry.path;
  return { ...entry, name: label };
}
