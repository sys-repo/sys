import type { t } from './common.ts';

/**
 * Tools for working with a module's source-code.
 */
export type JsrManifestLib = {
  /**
   * Create a new manifest instance from the given fetched definition.
   */
  create(pkg: t.Pkg, def: t.JsrFetch.PkgManifest): t.JsrManifest;

  /**
   * Create the manifest by fetching the definition from origin.
   */
  fetch(
    name: t.StringPkgName,
    version?: t.StringSemver,
    options?: t.JsrFetch.PkgOptions,
  ): Promise<t.JsrManifestFetchResponse>;
};

/**
 * A utility object representing a module manifest.
 */
export type JsrManifest = {
  /** Package identity for the manifest. */
  readonly pkg: t.Pkg;
  /** Raw manifest definition as returned by the JSR API. */
  readonly def: t.JsrFetch.PkgManifest;
  /** Sorted manifest paths. */
  readonly paths: t.StringPath[];
  /** Pull manifest files, optionally filtering them and writing them locally. */
  pull(options?: t.JsrManifestPullOptions | t.StringDir): Promise<t.JsrManifestPullResponse>;
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
  /** Wrapped manifest helper created from the fetched payload. */
  readonly manifest: t.JsrManifest;
  /** Success case never includes an error. */
  readonly error?: undefined; // Success case does not have an error.
};

/** Failed while fetching Manifest from origin. */
export type JsrManifestFetchFail = FetchCommon & {
  /** Aggregated failure explaining why the manifest could not be produced. */
  readonly error: t.StdError;
  /** Failures never include a manifest instance. */
  readonly manifest?: never; // Fail case will not include a manifest.
};

/**
 * Response from `manifest.pull` method.
 */
export type JsrManifestPullResponse = {
  /** True when every requested file was fetched successfully. */
  ok: boolean;
  /** Per-file fetch results in sorted path order after filtering. */
  files: t.JsrFetch.PkgFileResponse[];
  /** Aggregated fetch or write error, when any step failed. */
  error?: t.StdError;
  /** Output directory details when files were written to disk. */
  written?: {
    /** Absolute directory the package files were written into. */
    absolute: t.StringDir;
    /** Package-specific output directory relative to the configured write root. */
    relative: t.StringDir;
    /** Totals for the completed write step. */
    total: {
      /** Number of files written to disk. */
      files: t.NumberTotal;
    };
  };
};

/** Options passed to `manifest.pull` method. */
export type JsrManifestPullOptions = {
  /** Cancels fetch work when the observable emits. */
  dispose$?: t.UntilObservable;
  /** Base directory to write fetched files into. */
  write?: t.StringDir;
  /** Predicate used to keep or skip manifest paths before pulling them. */
  filter?: t.Fs.Path.Filter;
};
