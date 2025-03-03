import type { t } from './common.ts';

/**
 * Network fetching helpers against the "jsr.io" end-point.
 */
export type JsrFetchLib = {
  readonly Pkg: t.JsrFetchPkgLib;
  readonly Url: t.JsrUrlLib;
};

/**
 * Network fetching helpers against a specific JSR package.
 */
export type JsrFetchPkgLib = {
  /**
   * Retrieve the package's latest version and version history.
   */
  versions(name: string, options?: t.JsrFetchPkgOptions): Promise<t.JsrFetchPkgVersionsResponse>;

  /**
   * Retrieve meta-data about a specific package version.
   */
  info(
    name: t.StringPkgName,
    version?: t.StringSemver,
    options?: t.JsrFetchPkgOptions,
  ): Promise<t.JsrFetchPkgInfoResponse>;

  /**
   * Retrieve a fetcher for pulling source-code file data for a specific package/version
   */
  file(
    name: t.StringPkgName,
    version: t.StringSemver,
    options?: t.JsrFetchPkgOptions,
  ): t.JsrPkgFileFetcher;
};

/** Options for the `Jsr.Fetch.<fetch-method>` methods */
export type JsrFetchPkgOptions = { dispose$?: t.UntilObservable };

/** Options for the `Jsr.Fetch.<fetch-method>` methods that perform hash checksums on the fetched content. */
export type JsrFetchPkgChecksumOptions = JsrFetchPkgOptions & { checksum?: t.StringHash };

/** Resposne to a `Jsr.Fetch.Pkg.versions` request. */
export type JsrFetchPkgVersionsResponse = t.FetchResponse<t.JsrPkgMetaVersions>;

/** Response to a `Jsr.Fetch.Pkg.info` request. */
export type JsrFetchPkgInfoResponse = t.FetchResponse<t.JsrPkgVersionInfo>;

/**
 * Top level meta-data about a published package including it's version history.
 * https://jsr.io/docs/api#package-metadata
 */
export type JsrPkgMetaVersions = {
  scope: string;
  name: string;
  latest: t.StringSemver;
  versions: { [version: string]: JsrPkgMetaVersion };
};
/** Version details about a specific package version. */
export type JsrPkgMetaVersion = { yanked?: boolean };

/**
 * Meta-data about a specific published package version.
 * https://jsr.io/docs/api#package-version-metadata
 */
export type JsrPkgVersionInfo = {
  pkg: t.Pkg;
  manifest?: JsrPkgManifest;
  exports?: { [key: string]: string };
  moduleGraph1?: unknown;
  moduleGraph2?: unknown;
};

/**
 * The manifest of the source code file-structure (.ts files) within the package.
 */
export type JsrPkgManifest = { [path: string]: JsrPkgManifestFile };
export type JsrPkgManifestFile = { readonly size: number; readonly checksum: string };

/**
 * File fetching.
 */
export type JsrPkgFileFetcher = {
  pkg: t.Pkg;
  text(
    path: t.StringPath,
    options?: t.JsrFetchPkgChecksumOptions,
  ): Promise<t.JsrFetchPkgFileResponse>;
};
/** Response to a `Jsr.Fetch.Pkg.file::path()` request. */
export type JsrFetchPkgFileResponse = t.FetchResponse<string>;
