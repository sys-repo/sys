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

    /**
     * Hashing meta-data.
     * NB: This object is descriptive only and must not be included in hash input.
     */
    hash: {
      /**
       * Versioned URL to the hash-policy implementation
       * (for example a JSR package source file URL).
       */
      policy: t.StringUri;
    };
  };

  /** Map of hashes of the binary contents of the package. */
  hash: t.CompositeHash;
};

/**
 * Legacy distribution package metadata.
 * NB: Prior schema shape without `build.hash.policy`.
 */
export type DistPkgLegacy = Omit<DistPkg, 'build'> & {
  build: Omit<DistPkg['build'], 'hash'>;
};

/**
 * Distribution-package size statistics.
 */
export type DistPkgSize = {
  total: t.NumberBytes;
  pkg: t.NumberBytes;
};
