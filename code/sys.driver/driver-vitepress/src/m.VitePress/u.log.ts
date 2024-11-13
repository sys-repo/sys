import { ViteLog } from '@sys/driver-vite/log';
import { type t, Cli, c, Pkg } from './common.ts';

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
        table.push([c.gray('module'), c.gray(Pkg.toString(pkg))]);
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
    return input.replace(/^\.\//, '');
  },
} as const;
