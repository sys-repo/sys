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
   * Create the manifest by fetching the definition from origin.
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
  pull(options?: t.JsrManifestPullOptions): Promise<t.JsrManifestPullResponse>;
};

/**
 * Response from the `Manifest.fetch` method.
 */
export type JsrManifestFetchResponse = JsrManifestFetchSuccess | JsrManifestFetchFail;
type FetchCommon = {
  readonly ok: boolean;
  readonly status: t.HttpStatusCode;
  readonly origin: t.StringUrl;
};

/** Successfully fetched Manifest from origin. */
export type JsrManifestFetchSuccess = FetchCommon & {
  readonly manifest: t.JsrManifest;
  readonly error?: undefined; // Success case does not have an error.
};

/** Failed while fetching Manifest from origin. */
export type JsrManifestFetchFail = FetchCommon & {
  readonly error: t.StdError;
  readonly manifest?: never; // Fail case will not include a manifest.
};

/**
 * Response from `manifest.pull` method.
 */
export type JsrManifestPullResponse = {
  ok: boolean;
  files: t.JsrFetchPkgFileResponse[];
  error?: t.StdError;
};

/** Options passed to `manifest.pull` method. */
export type JsrManifestPullOptions = { dispose$?: t.UntilObservable };
