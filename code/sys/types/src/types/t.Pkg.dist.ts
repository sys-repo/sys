import type { t } from './common.ts';

/**
 * A distribution "package" meta-data.
 *
 * This is the type definition for the `/dist/pkg.json` JSON file
 * produced during a build/bundle operation for a module.
 */
export type DistPkg = {
  type: t.StringUrl;

  /** The package meta-data info. */
  pkg: t.Pkg;

  /** Distribution-package size statistics. */
  size: t.DistPkgSize;

  /** Path to the main JS entry point. */
  entry: t.StringPath;

  /** Map of hashes of the binary contents of the package. */
  hash: t.CompositeHash;
};

/**
 * Distribution-package size statistics.
 */
export type DistPkgSize = { total: t.NumberBytes };
