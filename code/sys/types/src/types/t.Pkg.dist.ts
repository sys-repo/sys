import type { t } from './common.ts';

/**
 * A distribution "package" meata-data.
 *
 * This is the type definition for the `/dist/pkg.json` JSON file
 * produced during a build/bundle operation for a module.
 */
export type DistPkg = {
  /** The package meta-data info. */
  pkg: t.Pkg;

  /** Distribution-package size statistics. */
  size: t.DistPkgSize;

  /** Path to the main JS entry point. */
  entry: t.StringPath;

  /** Map of hashes of the binary contents of the package. */
  hash: DistPkgHashes;
};

/**
 * The hashes of a ditribution-package.
 */
export type DistPkgHashes = {
  /** The overall hash of all file hashes (after they are sorted). */
  pkg: t.StringHash;

  /** Map of hashes mapped to the distribution-package's file paths. */
  files: { [path: t.StringPath]: t.StringHash };
};

/**
 * Distribution-package size statistics.
 */
export type DistPkgSize = { bytes: number };
