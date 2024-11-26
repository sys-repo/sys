import { type t, c, Cli, ViteLog } from './common.ts';

export const Log = {
  Build: {
    log: (args: t.ViteLogBundleArgs) => console.info(Log.Build.toString(args)),
    toString: (args: t.ViteLogBundleArgs) => ViteLog.Bundle.toString(args),
  },
  Dev: {
    log: (args: t.ViteLogDevArgs) => console.info(Log.Dev.toString(args)),
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
} as const;

/**
 * Helpers
 */
const wrangle = {
  formatPath(input: string = ''): string {
    return input ? input : `./`;
  },
} as const;
