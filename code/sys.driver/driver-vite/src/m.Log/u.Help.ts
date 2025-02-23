import { type t, c, pkg as modulePkg, Pkg, Semver } from './common.ts';
import { API } from './u.API.ts';
import { Dist } from './u.Dist.ts';

export const Help: t.ViteLogHelpLib = {
  async log(args) {
    const pkg = args.pkg ?? modulePkg;
    const dirs = args.dirs;

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
