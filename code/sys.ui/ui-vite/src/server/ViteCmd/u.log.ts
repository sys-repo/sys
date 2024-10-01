import { c, type t } from './common.ts';

export const Log = {
  /**
   * Startup log.
   */
  entry(pkg: t.Pkg, input: t.StringPath) {
    input = input.replace(/^\.\//, ''); // trim leading "./" relative prefix (reduce visual noise).
    console.info();
    console.info(c.gray(`Module:       ${c.white(c.bold(pkg.name))} ${pkg.version}`));
    console.info(c.brightGreen(`entry point:  ${c.gray(input)}`));
  },
} as const;
