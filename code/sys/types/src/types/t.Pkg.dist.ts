import type { t } from './common.ts';

/**
 * A distribution "package" meata-data.
 *
 * This is the type definition for the `/dist/pkg.json` JSON file
 * produced during a build/bundle operation for a module.
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
  entry: t.StringPath;

  /**
   * Map of hashes of the binary contents of the package.
   */
  hash: {
    './pkg': t.StringHash;
    './index.html': t.StringHash;
  };
};
