import { type t, c, Fs, Cli, opt } from '../common.ts';
import { Config } from '../u.config.ts';

type C = t.ServeTool.Command;
type M = t.ServeTool.MenuOption;

export const ServeMenu = {
  async bundlesMenuOptions(cwd: t.StringDir, location: t.ServeTool.DirConfig): Promise<M[]> {
    const res: M[] = [];
    const bundles = Config.orderByRecency(location.remoteBundles);

    for (const bundle of bundles) {
      const dir = bundle.local.dir;
      const path = Fs.join(cwd, dir, 'dist.json');
      const exists = await Fs.exists(path);
      if (exists) {
        const name = ` ${c.gray(c.dim('start/open: '))}${dir}`;
        const command = 'bundle:open' as C;
        const value = `${command}/${dir}` as C;
        res.push(opt(name, value));
      }
    }

    return res;
  },
};
