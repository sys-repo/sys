import { type t, c, Cli, Path, PATHS, pkg, ViteLog } from './common.ts';

/**
 * Console logging operations for the module.
 */
export const VitepressLog = {
  Build: {
    log: (args: t.ViteLogBundleArgs) => console.info(VitepressLog.Build.toString(args)),
    toString: (args: t.ViteLogBundleArgs) => ViteLog.Bundle.toString(args),
  },
  Dev: {
    log: (args: t.ViteLogDevArgs) => console.info(VitepressLog.Dev.toString(args)),
    toString: (args: t.ViteLogDevArgs) => {
      const { pkg } = args;
      const table = Cli.table([]);
      if (pkg) {
        const module = c.gray(`${c.white(pkg.name)}${c.dim('@')}${pkg.version}`);
        table.push([c.gray('module'), module]);
      }
      table.push([c.green(`input:`), wrangle.formatPath(args.inDir)]);
      return table.toString();
    },
  },

  /**
   * Display the help output.
   */
  async help(args: { dir?: t.StringDir; minimal?: boolean } = {}) {
    const { dir = PATHS.inDir, minimal = false } = args;
    await ViteLog.Help.log({
      pkg,
      dirs: {
        in: dir,
        out: Path.join(dir, PATHS.dist),
      },
      api: { minimal },
    });
    console.info();
  },
};

/**
 * Helpers
 */
const wrangle = {
  formatPath(path: string = ''): string {
    path = path.trim();
    if (path === '' || path === '.') path = './';
    if (path === './') path = `./ ${c.dim('(root directory)')}`;
    return c.gray(path);
  },
} as const;
