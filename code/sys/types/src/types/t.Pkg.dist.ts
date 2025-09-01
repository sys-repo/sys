import type { t } from './common.ts';

/**
 * Distribution package metadata (`/dist/pkg.json`).
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

  /** URL pathing metadata. */
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
