import type { t } from './common.ts';

/**
 * @module
 * Tools for working with JSR ("the Javascript Registry").
 * https://jsr.io/docs
 */
export type JsrLib = {
  readonly Fetch: t.JsrFetchLib;
  readonly Url: t.JsrUrlLib;
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
    version?: t.StringSemver,
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
  latest: t.StringSemver;
  versions: { [version: string]: JsrPackageMetaVersion };
};
/** Version details about a specific package version. */
export type JsrPackageMetaVersion = { yanked?: boolean };

/**
 * Meta-data about a specific published package version.
 * https://jsr.io/docs/api#package-version-metadata
 */
export type JsrPkgVersionInfo = {
  pkg: { name: string; version: t.StringSemver };
  scope: string;
  manifest?: JsrPkgManifest;
  exports?: { [key: string]: string };
  moduleGraph1?: unknown;
  moduleGraph2?: unknown;
};

/**
 * The manifest of the source code file-structure (.ts files) within the package.
 */
export type JsrPkgManifest = { [path: string]: JsrPkgManifestFile };
export type JsrPkgManifestFile = { size: number; checksum: string };

/**
 * Standard URL generators for the JSR registry.
 */
export type JsrUrlLib = {
  readonly origin: t.StringUrl;
  readonly Pkg: t.JsrUrlPkgLib;
};
/**
 * URLs pertaining to packages.
 */
export type JsrUrlPkgLib = {
  /**
   * Generate the URL for meta-data information about a package as a whole.
   * https://jsr.io/docs/api#package-metadata
   */
  metadata(name: string): t.StringUrl;

  /**
   * Generate the URL for meta-data about a specific package version.
   */
  version(name: string, version: t.StringSemver): t.StringUrl;
};
