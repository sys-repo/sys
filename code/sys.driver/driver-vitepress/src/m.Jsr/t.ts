import type { t } from './common.ts';

/**
 * @module
 * Tools for working with JSR ("the Javascript Registry").
 * https://jsr.io/docs
 */
export type JsrLib = {
  readonly Fetch: t.JsrFetchLib;
};

/**
 * Network fetching helpers against the "jsr.io" end-point.
 */
export type JsrFetchLib = {
  readonly Pkg: t.JsrFetchPkgLib;
};

/**
 * Network fetching helpers against a specific package.
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
    name: string,
    version?: t.StringSemVer,
    options?: t.JsrFetchPkgOptions,
  ): Promise<t.JsrFetchPkgInfoResponse>;
};

/** Options for the `Jsr.Fetch.versions` method */
export type JsrFetchPkgOptions = { dispose$?: t.UntilObservable };
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
  latest: t.StringSemVer;
  versions: { [version: string]: JsrPackageMetaVersion };
};
/** Version details about a specific package version. */
export type JsrPackageMetaVersion = { yanked?: boolean };

/**
 * Meta-data about a specific published package version.
 * https://jsr.io/docs/api#package-version-metadata
 */
export type JsrPkgVersionInfo = {
  scope: string;
  name: string;
  version: t.StringSemVer;
  manifest: JsrPkgManifest;
  exports: { [key: string]: string };
};

export type JsrPkgManifest = { [path: string]: JsrPkgManifestFile };
export type JsrPkgManifestFile = { size: number; checksum: string };
