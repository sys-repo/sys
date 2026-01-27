import { type t, c, Fs, opt, Pkg } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

type C = t.ServeTool.Command;
type M = t.ServeTool.MenuOption;

export const ServeMenu = {
  async bundlesMenuOptions(
    cwd: t.StringDir,
    location: t.ServeTool.LocationYaml.Location,
    opts: { includeRoot?: boolean } = {},
  ): Promise<M[]> {
    const { includeRoot = true } = opts;

    const raw: M[] = [];
    const withTreeBranches = (items: readonly M[], depth = 1): M[] => {
      return items.map((item, index) => {
        const tree = Fmt.Tree.branch([index, items], depth);
        const name = ` ${tree} ${String(item.name).trimStart()}`.trimEnd();
        return { ...item, name };
      });
    };

    const bundles = location.remoteBundles ?? [];
    const command = 'bundle:open' as C;
    const appendDir = (command: C, dir: string) => `${command}/${dir}` as C;

    if (includeRoot) {
      raw.push(opt(` ${c.dim('root')}   /`, appendDir(command, '')));
    }

    for (const bundle of bundles) {
      const dir = bundle.local.dir;
      const path = Fs.join(cwd, dir, 'dist.json');
      const exists = await Fs.exists(path);
      if (exists) {
        const dist = (await Pkg.Dist.load(dir)).dist;
        const hx = dist?.hash.digest ?? '';
        const hxshort = c.green(hx.slice(-5));
        const name = ` ${c.gray(c.dim(`#${hxshort} `))}/${dir}`;
        const value = appendDir(command, dir);
        raw.push(opt(name, value));
      }
    }

    return withTreeBranches(raw, 1);
  },
};
