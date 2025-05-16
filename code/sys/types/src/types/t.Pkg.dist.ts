import type { t } from './common.ts';

/**
 * A distribution "package" meta-data.
 *
 * This is the type definition for the `/dist/pkg.json` JSON file
 * produced during a build/bundle operation for a module.
 */
export type DistPkg = {
  /** Type definition. */
  type: t.StringTypeUrl;

  /** The package info. */
  pkg: t.Pkg;

  /** Build meta-data. */
  build: {
    /** Timestamp of build. */
    time: t.UnixTimestamp;
    /** Distribution-package size statistics. */
    size: t.DistPkgSize;
    /** The builder module. */
    builder: t.StringPkgNameVer;
    /** URI containing the runtime versions the builder ran on. */
    runtime: t.StringUri;
  };

  /** Path to the main JS entry point. */
  entry: t.StringPath;

  /** URL pathing meta-dat. */
  url: {
    /** Base file path expected for HTTP/Web loading.  */
    base: t.StringDir;
  };

  /** Map of hashes of the binary contents of the package. */
  hash: t.CompositeHash;
};

/**
 * Distribution-package size statistics.
 */
export type DistPkgSize = {
  total: t.NumberBytes;
  pkg: t.NumberBytes;
};
