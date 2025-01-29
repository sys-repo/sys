import { type t, c, Fs, pkg as modulePkg, PATHS, Pkg } from './common.ts';
import { API } from './u.API.ts';
import { Dist } from './u.Dist.ts';

export const Help: t.ViteLogHelpLib = {
  async log(args = {}) {
    const pkg = args.pkg ?? modulePkg;
    API.log({ ...args.api, minimal: false });
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
      const notBuilt = c.italic(c.yellow('(no bundle)'));
      console.info(c.gray(`${c.white(c.bold(pkg.name))} ${pkg.version}`));
      console.info(c.gray(`${notBuilt} → run: ${buildCmd}`));
    }

    console.info();
  },
};
