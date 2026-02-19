import { type t, c, Fs, Path, Pkg } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

type Entry = {
  readonly name: string;
  readonly path: string;
};

export type OpenMenuPick = { cmd: 'open'; path: string };

export const OpenTargets = {
  async menuOptions(location: t.ServeTool.LocationYaml.Location): Promise<readonly {
    name: string;
    value: OpenMenuPick;
  }[]> {
    const roots = await OpenTargets.discover(location.dir);
    const withTreeBranches = (
      items: readonly Entry[],
      depth = 1,
    ): ReadonlyArray<{ name: string; value: OpenMenuPick }> => {
      return items.map((item, index) => {
        const tree = Fmt.Tree.branch([index, items], depth);
        const name = ` ${tree} ${String(item.name).trimStart()}`.trimEnd();
        return { name, value: { cmd: 'open', path: item.path } };
      });
    };
    return withTreeBranches(roots, 1);
  },

  async discover(dir: t.StringDir): Promise<readonly Entry[]> {
    const entries: Entry[] = [{ name: `${c.dim('root')}   /`, path: '' }];
    const dirs = await Fs.glob(dir, { includeDirs: true }).find('**/*');

    for (const entry of dirs) {
      if (!entry.isDirectory) continue;
      const rel = Path.relative(dir, entry.path).replaceAll('\\', '/');
      if (!rel || rel === '.') continue;

      const indexPath = Fs.join(entry.path, 'index.html');
      const distPath = Fs.join(entry.path, 'dist.json');
      const hasIndex = await Fs.exists(indexPath);
      const hasDist = await Fs.exists(distPath);
      if (!hasIndex || !hasDist) continue;

      const dist = (await Pkg.Dist.load(entry.path)).dist;
      const hx = dist?.hash?.digest ?? '';
      const hxshort = hx ? c.green(hx.slice(-5)) : c.gray(c.dim('-----'));
      const label = `${c.gray(c.dim(`#${hxshort} `))}${rel}`;
      entries.push({ name: label, path: rel });
    }

    const [root, ...rest] = entries;
    rest.sort((a, b) => a.path.localeCompare(b.path));
    return [root, ...rest];
  },
} as const;
