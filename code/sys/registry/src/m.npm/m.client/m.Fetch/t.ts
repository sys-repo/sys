import type { t } from './common.ts';

/**
 * Network fetching helpers against the npm registry end-point.
 */
export namespace NpmFetch {
  /** npm fetch helper library surface. */
  export type Lib = {
    /** Package-scoped fetch helpers. */
    readonly Pkg: PkgLib;
    /** npm registry URL helpers. */
    readonly Url: NpmUrlLib;
  };

  /**
   * Network fetching helpers against a specific npm package.
   */
  export type PkgLib = {
    /**
     * Retrieve the package's latest version and version history.
     */
    versions(name: string, options?: PkgOptions): Promise<PkgVersionsResponse>;

    /**
     * Retrieve meta-data about a specific package version.
     */
    info(name: string, version?: t.StringSemver, options?: PkgOptions): Promise<PkgInfoResponse>;
  };

  /** Options for the `Npm.Fetch.<fetch-method>` methods. */
  export type PkgOptions = {
    /** Cancels the underlying request when the observable emits. */
    dispose$?: t.UntilObservable;
  };

  /** Response to a `Npm.Fetch.Pkg.versions` request. */
  export type PkgVersionsResponse = t.FetchResponse<PkgMetaVersions>;

  /** Response to a `Npm.Fetch.Pkg.info` request. */
  export type PkgInfoResponse = t.FetchResponse<PkgVersionInfo>;

  /**
   * Top level meta-data about a published package including version history.
   */
  export type PkgMetaVersions = {
    /** Package identity that was requested. */
    name: string;
    /** Latest version reported by the registry. */
    latest: t.StringSemver;
    /** Published versions keyed by version string. */
    versions: { [version: string]: PkgMetaVersion };
  };

  /** Version details about a specific package version. */
  export type PkgMetaVersion = {
    /** True when the version is deprecated in registry metadata. */
    deprecated?: string;
  };

  /**
   * Meta-data about a specific published package version.
   */
  export type PkgVersionInfo = {
    /** The package identity that was requested. */
    pkg: t.Pkg;
    /** Distribution payload metadata. */
    dist?: PkgDistInfo;
    /** Direct runtime dependencies. */
    dependencies?: Record<string, string>;
    /** Direct development dependencies. */
    devDependencies?: Record<string, string>;
    /** Export map or main entry metadata when present. */
    exports?: unknown;
  };

  /** Distribution metadata for a published npm package version. */
  export type PkgDistInfo = {
    /** Tarball URL for the published artifact. */
    tarball?: string;
    /** Published integrity string when present. */
    integrity?: string;
    /** Shasum value when present. */
    shasum?: string;
  };
}

/** Alias for the npm fetch helper library surface. */
export type NpmFetchLib = NpmFetch.Lib;
/** Alias for the package-scoped npm fetch helpers. */
export type NpmFetchPkgLib = NpmFetch.PkgLib;
/** Alias for common npm fetch options. */
export type NpmFetchPkgOptions = NpmFetch.PkgOptions;
/** Alias for package version-list responses. */
export type NpmFetchPkgVersionsResponse = NpmFetch.PkgVersionsResponse;
/** Alias for package version metadata responses. */
export type NpmFetchPkgInfoResponse = NpmFetch.PkgInfoResponse;
/** Alias for top-level npm package metadata. */
export type NpmPkgMetaVersions = NpmFetch.PkgMetaVersions;
/** Alias for per-version npm package metadata. */
export type NpmPkgMetaVersion = NpmFetch.PkgMetaVersion;
/** Alias for npm package version metadata. */
export type NpmPkgVersionInfo = NpmFetch.PkgVersionInfo;
/** Alias for npm distribution metadata. */
export type NpmPkgDistInfo = NpmFetch.PkgDistInfo;

/**
 * URL helpers for npm registry package end-points.
 */
export type NpmUrlLib = {
  /** Package-specific URL helpers. */
  readonly Pkg: NpmUrlPkgLib;
};

/** URL helpers for a specific npm package. */
export type NpmUrlPkgLib = {
  /** Package metadata endpoint. */
  metadata(name: string): string;
  /** Specific package version endpoint. */
  version(name: string, version: t.StringSemver): string;
};
