import type { t } from './common.ts';

/**
 * Network fetching helpers against the "jsr.io" end-point.
 */
export namespace JsrFetch {
  export type Lib = {
    readonly Pkg: PkgLib;
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
  export type PkgOptions = { dispose$?: t.UntilObservable };

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
    scope: string;
    name: string;
    latest: t.StringSemver;
    versions: { [version: string]: PkgMetaVersion };
  };

  /** Version details about a specific package version. */
  export type PkgMetaVersion = { yanked?: boolean };

  /**
   * Meta-data about a specific published package version.
   * https://jsr.io/docs/api#package-version-metadata
   */
  export type PkgVersionInfo = {
    pkg: t.Pkg;
    manifest?: PkgManifest;
    exports?: { [key: string]: string };
    moduleGraph1?: unknown;
    moduleGraph2?: unknown;
  };

  /**
   * The manifest of the source code file-structure (.ts files) within the package.
   */
  export type PkgManifest = { [path: string]: PkgManifestFile };
  export type PkgManifestFile = { readonly size: number; readonly checksum: string };

  /**
   * File fetching.
   */
  export type PkgFileFetcher = {
    pkg: t.Pkg;
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
