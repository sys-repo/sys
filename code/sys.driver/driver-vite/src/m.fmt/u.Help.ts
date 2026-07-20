import { c, Pkg, pkg as modulePkg, type t } from './common.ts';
import { Tasks } from './u.Tasks.ts';
import { Dist } from './u.Dist.ts';

export const Help: t.ViteLog.Help.Lib = {
  async log(args) {
    const pkg = args.pkg ?? modulePkg;
    const dirs = args.dirs;

    // Common tasks.
    if (args.tasks !== false) Tasks.log({ ...args.tasks, minimal: false });
    console.info();

    // Dist bundle.
    const { dist } = await Pkg.Dist.load(dirs.out);
    if (dist) {
      Dist.log(dist, { dirs });
    } else {
      // NB: not built yet.
      const buildCmd = c.green(`deno task ${c.bold('build')}`);
      const notBuilt = c.italic(c.bold(c.yellow('(no bundle)')));
      console.info(c.gray(`${c.white(c.bold(pkg.name))} ${pkg.version}`));
      console.info(c.gray(`${notBuilt} → run: ${buildCmd}`));
    }

    console.info();
  },
};
