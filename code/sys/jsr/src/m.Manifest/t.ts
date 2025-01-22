import type { t } from './common.ts';

/**
 * Tools for working with a module's source-code.
 */
export type JsrManifestLib = {
  /**
   * Create a new manifest instance from the given fetched definition.
   */
  create(pkg: t.Pkg, def: t.JsrPkgManifest): t.JsrManifest;

  /**
   * Fetch the manifest from origin.
   */
  fetch(
    name: t.StringPkgName,
    version?: t.StringSemver,
    options?: t.JsrFetchPkgOptions,
  ): Promise<t.JsrManifestFetchResponse>;
};

/**
 * A utility object representing a module manifest.
 */
export type JsrManifest = {
  readonly pkg: t.Pkg;
  readonly def: t.JsrPkgManifest;
  readonly paths: t.StringPath[];
};

/**
 * Response from the `Manifest.fetch` method.
 */
export type JsrManifestFetchResponse = JsrManifestFetchSuccess | JsrManifestFetchFail;
export type JsrManifestFetchSuccess = {
  readonly status: t.HttpStatusCode;
  readonly manifest: t.JsrManifest;
  readonly error?: undefined; // Success case does not have an error.
};

export type JsrManifestFetchFail = {
  readonly status: t.HttpStatusCode;
  readonly error: t.StdError;
  readonly manifest?: never; // Fail case will not include a manifest.
};
