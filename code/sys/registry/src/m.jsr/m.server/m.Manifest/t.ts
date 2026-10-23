import type { t } from './common.ts';

/**
 * Tools for working with a module's source-code.
 */
export declare namespace JsrManifest {
  /** JSR source manifest API. */
  export type Lib = {
    /**
     * Create a new manifest instance from the given fetched definition.
     */
    create(pkg: t.Pkg, def: t.JsrFetch.Pkg.Manifest): Instance;

    /**
     * Create the manifest by fetching the definition from origin.
     */
    fetch(
      name: t.StringPkgName,
      version?: t.StringSemver,
      options?: t.JsrFetch.Pkg.Options,
    ): Promise<Fetch.Response>;
  };

  /**
   * A utility object representing a module manifest.
   */
  export type Instance = {
    /** Package identity for the manifest. */
    readonly pkg: t.Pkg;
    /** Raw manifest definition as returned by the JSR API. */
    readonly def: t.JsrFetch.Pkg.Manifest;
    /** Sorted manifest paths. */
    readonly paths: t.StringPath[];
    /** Pull manifest files, optionally filtering them and writing them locally. */
    pull(options?: Pull.Options | t.StringDir): Promise<Pull.Response>;
  };

  /**
   * Manifest fetch contracts.
   */
  export namespace Fetch {
    /** Response from the `Manifest.fetch` method. */
    export type Response = Success | Fail;

    type Common = {
      readonly ok: boolean;
      readonly status: t.HttpStatusCode;
      readonly origin: t.StringUrl;
    };

    /** Successfully fetched Manifest from origin. */
    export type Success = Common & {
      /** Wrapped manifest helper created from the fetched payload. */
      readonly manifest: Instance;
      /** Success case never includes an error. */
      readonly error?: undefined;
    };

    /** Failed while fetching Manifest from origin. */
    export type Fail = Common & {
      /** Aggregated failure explaining why the manifest could not be produced. */
      readonly error: t.StdError;
      /** Failures never include a manifest instance. */
      readonly manifest?: never;
    };
  }

  /**
   * Manifest pull contracts.
   */
  export namespace Pull {
    /** Response from `manifest.pull` method. */
    export type Response = {
      /** True when every requested file was fetched successfully. */
      ok: boolean;
      /** Per-file fetch results in sorted path order after filtering. */
      files: t.JsrFetch.Pkg.FileResponse[];
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
    export type Options = {
      /** Cancels fetch work when the lifecycle ends. */
      until?: t.UntilInput;
      /** Base directory to write fetched files into. */
      write?: t.StringDir;
      /** Predicate used to keep or skip manifest paths before pulling them. */
      filter?: t.Fs.Path.Filter;
    };
  }
}
