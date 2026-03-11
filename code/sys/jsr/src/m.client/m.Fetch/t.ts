import type { t } from './common.ts';

/**
 * Network fetching helpers against the "jsr.io" end-point.
 */
export namespace JsrFetch {
  export type Lib = {
    /** Package-scoped fetch helpers. */
    readonly Pkg: PkgLib;
    /** JSR registry URL helpers. */
    readonly Url: t.JsrUrlLib;
  };

  /**
   * Network fetching helpers against a specific JSR package.
   */
  export type PkgLib = {
    /**
     * Retrieve the package's latest version and version history.
     */
    versions(name: string, options?: PkgOptions): Promise<PkgVersionsResponse>;

    /**
     * Retrieve meta-data about a specific package version.
     */
    info(
      name: t.StringPkgName,
      version?: t.StringSemver,
      options?: PkgOptions,
    ): Promise<PkgInfoResponse>;

    /**
     * Retrieve a fetcher for pulling source-code file data for a specific package/version
     */
    file(
      name: t.StringPkgName,
      version: t.StringSemver,
      options?: PkgOptions,
    ): PkgFileFetcher;
  };

  /** Options for the `Jsr.Fetch.<fetch-method>` methods */
  export type PkgOptions = {
    /** Cancels the underlying request when the observable emits. */
    dispose$?: t.UntilObservable;
  };

  /** Options for the `Jsr.Fetch.<fetch-method>` methods that perform hash checksums on the fetched content. */
  export type PkgChecksumOptions = PkgOptions & { checksum?: t.StringHash };

  /** Resposne to a `Jsr.Fetch.Pkg.versions` request. */
  export type PkgVersionsResponse = t.FetchResponse<PkgMetaVersions>;

  /** Response to a `Jsr.Fetch.Pkg.info` request. */
  export type PkgInfoResponse = t.FetchResponse<PkgVersionInfo>;

  /** Response to a `Jsr.Fetch.Pkg.file::path()` request. */
  export type PkgFileResponse = t.FetchResponse<string>;

  /**
   * Top level meta-data about a published package including it's version history.
   * https://jsr.io/docs/api#package-metadata
   */
  export type PkgMetaVersions = {
    /** Package scope without the leading `@`. */
    scope: string;
    /** Package name within the scope. */
    name: string;
    /** Latest published version reported by JSR. */
    latest: t.StringSemver;
    /** Published versions keyed by version string. */
    versions: { [version: string]: PkgMetaVersion };
  };

  /** Version details about a specific package version. */
  export type PkgMetaVersion = {
    /** True when the version has been yanked from normal resolution. */
    yanked?: boolean;
  };

  /**
   * Meta-data about a specific published package version.
   * https://jsr.io/docs/api#package-version-metadata
   */
  export type PkgVersionInfo = {
    /** The package identity that was requested. */
    pkg: t.Pkg;
    /** Source-file manifest keyed by package-relative path. */
    manifest?: PkgManifest;
    /** Export map returned by JSR. */
    exports?: { [key: string]: string };
    /** Opaque module-graph payload returned by JSR. */
    moduleGraph1?: unknown;
    /** Opaque module-graph payload returned by JSR. */
    moduleGraph2?: unknown;
  };

  /**
   * The manifest of the source code file-structure (.ts files) within the package.
   */
  export type PkgManifest = { [path: string]: PkgManifestFile };
  /** Meta-data for a single manifest entry. */
  export type PkgManifestFile = {
    /** File size in bytes. */
    readonly size: number;
    /** Content checksum published by JSR for integrity checks. */
    readonly checksum: string;
  };

  /**
   * File fetching.
   */
  export type PkgFileFetcher = {
    /** The package/version this fetcher is bound to. */
    pkg: t.Pkg;
    /** Retrieve text content for a package-relative path. */
    text(path: t.StringPath, options?: PkgChecksumOptions): Promise<PkgFileResponse>;
  };
}

export type JsrFetchLib = JsrFetch.Lib;
export type JsrFetchPkgLib = JsrFetch.PkgLib;
export type JsrFetchPkgOptions = JsrFetch.PkgOptions;
export type JsrFetchPkgChecksumOptions = JsrFetch.PkgChecksumOptions;
export type JsrFetchPkgVersionsResponse = JsrFetch.PkgVersionsResponse;
export type JsrFetchPkgInfoResponse = JsrFetch.PkgInfoResponse;
export type JsrFetchPkgFileResponse = JsrFetch.PkgFileResponse;
export type JsrPkgMetaVersions = JsrFetch.PkgMetaVersions;
export type JsrPkgMetaVersion = JsrFetch.PkgMetaVersion;
export type JsrPkgVersionInfo = JsrFetch.PkgVersionInfo;
export type JsrPkgManifest = JsrFetch.PkgManifest;
export type JsrPkgManifestFile = JsrFetch.PkgManifestFile;
export type JsrPkgFileFetcher = JsrFetch.PkgFileFetcher;
