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
  /** Retrieve the package's latest version and version history. */
  versions(name: string, options?: t.JsrFetchVersionsOptions): Promise<t.JsrFetchVersionsResponse>;

};

/** Options for the `Jsr.Fetch.versions` method */
export type JsrFetchVersionsOptions = { dispose$?: t.UntilObservable };

/** Resposne to a `Jsr.Fetch.versions` request. */
export type JsrFetchVersionsResponse = t.FetchResponse<t.JsrPackageMeta>;

/**
 * The meta-data about a module.
 * https://jsr.io/docs/api#package-metadata
 *
 * ```
 * GET: https://jsr.io/@<scope>/<package-name>/meta.json
 * ```
 */
export type JsrPackageMeta = {
  scope: string;
  name: string;
  latest: t.SemVer;
  versions: { [version: string]: JsrPackageMetaVersion };
};
/** Version details about a specific package version. */
export type JsrPackageMetaVersion = { yanked?: boolean };
