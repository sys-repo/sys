import type { t } from './common.ts';

/** The sole supported Dist content interpretation and hash domain. */
export type DistScheme = 'sys.dist/v2';

/** Independently supplied expectation of a distribution's canonical payload identity. */
export type DistPin = {
  readonly scheme: t.DistScheme;
  readonly digest: t.StringHash;
};

/**
 * Content descriptor: exact payload paths, SHA-256 checksums, and canonical required byte lengths.
 * A descriptor alone is a claim, not independent authority or proof of current file bytes.
 */
export type DistContent = {
  readonly scheme: t.DistScheme;
  readonly digest: t.StringHash;
  readonly parts: Readonly<Record<t.StringRelativePath, t.StringHash>>;
};

/** Content pins for a set of named distributions. */
export type DistPins<N extends string = string> = {
  readonly pins: Readonly<Record<N, t.DistPin>>;
};

/**
 * Distribution package metadata (`/dist/dist.json`).
 */
export type DistPkg = {
  /** Type definition. */
  type: t.StringTypeUrl;

  /**
   * Descriptive root package label, excluded from content identity.
   * Not authority for an authenticated package check; that requires verified payload bytes.
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
       * Descriptive only; verification never executes these rules.
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

  /** Canonical payload identity and inventory; root metadata is not covered by this digest. */
  hash: t.DistContent;
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
  readonly 'rules:digest': t.StringHash;
};
