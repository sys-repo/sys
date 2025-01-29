import { type t, c, Cli, Fs, PATHS, pkg, Pkg, ViteLog } from './common.ts';

/**
 * Console logging operations for the module.
 */
export const VitepressLog = {
  API: ViteLog.API,

  Build: {
    log: (args: t.ViteLogBundleArgs) => console.info(VitepressLog.Build.toString(args)),
    toString: (args: t.ViteLogBundleArgs) => ViteLog.Bundle.toString(args),
  },
  Dev: {
    log: (args: t.ViteLogDevArgs) => console.info(VitepressLog.Dev.toString(args)),
    toString: (args: t.ViteLogDevArgs) => {
      const { pkg } = args;
      const inDir = wrangle.formatPath(args.inDir);
      const table = Cli.table([]);
      if (pkg) {
        const module = c.gray(`${c.white(pkg.name)}${c.dim('@')}${pkg.version}`);
        table.push([c.gray('module'), module]);
      }
      table.push([c.green(`input:`), c.gray(inDir)]);
      return table.toString();
    },
  },

  /**
   * Display the help output.
   */
  async help(args: { dir?: t.StringDir; minimal?: boolean } = {}) {
    const { dir = PATHS.inDir, minimal = false } = args;
    VitepressLog.API.log({ minimal });
    console.info();

    const { dist } = await Pkg.Dist.load(Fs.resolve(dir, PATHS.dist));
    if (dist) {
      ViteLog.Dist.log(dist, { dirs: { in: dir } });
    } else {
      const buildCmd = c.green(`deno task ${c.bold('build')}`);
      const notBuilt = c.italic(c.yellow('(no bundle)'));
      console.info(c.gray(`${c.white(c.bold(pkg.name))} ${pkg.version}`));
      console.info(c.gray(`${notBuilt} → run: ${buildCmd}`));
    }

    console.info();
  },
};

/**
 * Helpers
 */
const wrangle = {
  formatPath(input: string = ''): string {
    return input ? input : `./`;
  },
} as const;
