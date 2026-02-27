import type { t } from './common.ts';

/**
 * Distribution package metadata (`/dist/dist.json`).
 */
export type DistPkg = {
  /** Type definition. */
  type: t.StringTypeUrl;

  /**
   * Optional package identity metadata for the content root.
   * Omitted when the dist describes non-package folder content.
   */
  pkg?: t.Pkg;

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

      /**
       * Effective ignore-policy used to scope hashed files.
       * If present, this policy must reproduce `hash.parts`.
       */
      ignore?: t.DistPkgHashIgnore;
    };

    /**
     * Detached signature descriptor.
     * NB: Descriptive metadata only; excluded from hash input.
     */
    sign?: {
      /** Path to the detached signature sidecar (typically relative to the dist root). */
      path: t.StringPath;

      /** Signature scheme identifier for the detached signature. */
      scheme: 'Ed25519';

      /**
       * Verifier key selection hint (for example key ID or public-key fingerprint).
       * NB: This is not a trust root.
       */
      key?: string;
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

/**
 * Canonical ignore policy that produced `DistPkg.hash.parts`.
 */
export type DistPkgHashIgnore = {
  /** Ignore syntax/engine identifier. */
  format: 'gitignore';
  /** Effective ordered ignore rules used during compute. */
  rules: string[];
  /** Digest of canonical serialized rules. */
  digest: t.StringHash;
};
