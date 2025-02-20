import { Wrangle } from '../m.Vite/u.wrangle.ts';

import { type t, c, Fs, pkg as modulePkg, Pkg, Semver } from './common.ts';
import { API } from './u.API.ts';
import { Dist } from './u.Dist.ts';

export const Help: t.ViteLogHelpLib = {
  async log(args = {}) {
    const pkg = args.pkg ?? modulePkg;
    const dir = args.dir ? Fs.resolve(args.dir) : Fs.cwd();
    const paths = await Wrangle.pathsFromConfigfile(dir);

    const dirs = {
      in: Fs.join(paths.cwd, paths.app.entry),
      out: Fs.join(paths.cwd, paths.app.outDir),
    };

    // API (commands).
    API.log({ ...args.api, minimal: false });
    console.info();

    // Dist bundle.
    const { dist } = await Pkg.Dist.load(dirs.out);
    if (dist) {
      Dist.log(dist, { dirs });

      // Module info.
      const fmtTargetVer = c.bold(c.brightCyan(Semver.toString(pkg.version)));
      console.info();
      console.info(c.gray(`Project at version:`));
      console.info(c.gray(`${c.white(c.bold(pkg.name))}@${fmtTargetVer}`));
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
