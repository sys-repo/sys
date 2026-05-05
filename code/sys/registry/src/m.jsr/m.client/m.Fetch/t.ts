import type { t } from './common.ts';

/**
 * Network fetching helpers against the "jsr.io" end-point.
 */
export namespace JsrFetch {
  /** JSR fetch helper library surface. */
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
    /** Cancels the underlying request when the lifecycle ends. */
    until?: t.UntilInput;
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
    readonly pkg: t.Pkg;
    /** Source-file manifest keyed by package-relative path. */
    readonly manifest?: PkgManifest;
    /** Export map returned by JSR. */
    readonly exports?: { readonly [key: string]: string };
    /** Normalized module graph returned by JSR when available. */
    readonly graph?: PkgGraph;
  };

  /** Normalized JSR module graph used for planning and dependency analysis. */
  export type PkgGraph = {
    /** Upstream graph payload format that produced this normalized graph. */
    readonly format: 1 | 2;
    /** Package modules included in the registry graph payload. */
    readonly modules: readonly PkgGraphModule[];
  };

  /** One module in the normalized JSR package graph. */
  export type PkgGraphModule = {
    /** Package-relative path or module specifier identifying the module. */
    readonly path: string;
    /** Direct imports/dependencies referenced by the module. */
    readonly dependencies: readonly PkgGraphDependency[];
  };

  /** One dependency reference found in a normalized JSR module graph. */
  export type PkgGraphDependency = {
    /** Import specifier as reported by the registry graph payload. */
    readonly specifier: string;
    /** Optional dependency kind when reported by the registry graph payload. */
    readonly kind?: string;
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

/** Alias for the JSR fetch helper library surface. */
export type JsrFetchLib = JsrFetch.Lib;
/** Alias for the package-scoped JSR fetch helpers. */
export type JsrFetchPkgLib = JsrFetch.PkgLib;
/** Alias for common JSR fetch options. */
export type JsrFetchPkgOptions = JsrFetch.PkgOptions;
/** Alias for checksum-aware JSR fetch options. */
export type JsrFetchPkgChecksumOptions = JsrFetch.PkgChecksumOptions;
/** Alias for package version-list responses. */
export type JsrFetchPkgVersionsResponse = JsrFetch.PkgVersionsResponse;
/** Alias for package version metadata responses. */
export type JsrFetchPkgInfoResponse = JsrFetch.PkgInfoResponse;
/** Alias for package file text responses. */
export type JsrFetchPkgFileResponse = JsrFetch.PkgFileResponse;
/** Alias for top-level JSR package metadata. */
export type JsrPkgMetaVersions = JsrFetch.PkgMetaVersions;
/** Alias for per-version JSR package metadata. */
export type JsrPkgMetaVersion = JsrFetch.PkgMetaVersion;
/** Alias for JSR package version metadata. */
export type JsrPkgVersionInfo = JsrFetch.PkgVersionInfo;
/** Alias for normalized JSR package graph data. */
export type JsrPkgGraph = JsrFetch.PkgGraph;
/** Alias for one normalized JSR package graph module. */
export type JsrPkgGraphModule = JsrFetch.PkgGraphModule;
/** Alias for one normalized JSR package graph dependency. */
export type JsrPkgGraphDependency = JsrFetch.PkgGraphDependency;
/** Alias for the JSR package file manifest. */
export type JsrPkgManifest = JsrFetch.PkgManifest;
/** Alias for a single JSR package manifest entry. */
export type JsrPkgManifestFile = JsrFetch.PkgManifestFile;
/** Alias for the bound JSR package file fetcher. */
export type JsrPkgFileFetcher = JsrFetch.PkgFileFetcher;
