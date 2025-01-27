import { type t, c, Fs, pkg as modulePkg, PATHS, Pkg } from './common.ts';
import { UsageAPI } from './u.UsageAPI.ts';
import { Dist } from './u.Dist.ts';

export const Help: t.ViteLogHelpLib = {
  async log(args = {}) {
    const pkg = args.pkg ?? modulePkg;
    UsageAPI.log({ ...args.api, minimal: false });
    console.info();

    const dirs = {
      in: Fs.resolve(args.in ?? '.'),
      out: args.out ? Fs.resolve(args.out) : Fs.resolve(PATHS.dist),
    };

    const { dist } = await Pkg.Dist.load(dirs.out);
    if (dist) {
      Dist.log(dist, { dirs });
    } else {
      const buildCmd = c.green(`deno task ${c.bold('build')}`);
      const notBuilt = c.italic(c.yellow('(not yet built)'));
      console.info(c.gray(`${c.white(c.bold(pkg.name))} ${pkg.version}`));
      console.info(c.gray(`${notBuilt} → run:`));
      console.info(c.gray(`                      ${buildCmd}`));
    }

    console.info();
  },
};
