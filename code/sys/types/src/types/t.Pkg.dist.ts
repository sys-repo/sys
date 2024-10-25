import type { t } from './common.ts';

/**
 * The types for the `/dist/pkg.json` file produced
 * during a `build` bundling operation.
 */
export type DistPkg = {
  /**
   * Type refs.
   */
  type: { self: t.StringUrl };

  /**
   * The package meta-data info.
   */
  pkg: t.Pkg;

  /**
   * Path to the main entry point.
   */
  main: t.StringPath;

  /**
   * Map of hashes of the binary contents of the package.
   */
  hash: {
    './pkg': t.StringHash;
    './index.html': t.StringHash;
  };
};
