import type { t } from './common.ts';

/**
 * Network fetching helpers against the "jsr.io" end-point.
 */
export declare namespace JsrFetch {
  /** JSR fetch helper library surface. */
  export type Lib = {
    /** Package-scoped fetch helpers. */
    readonly Pkg: Pkg.Lib;
    /** JSR registry URL helpers. */
    readonly Url: t.JsrUrl.Lib;
  };

  /**
   * Network fetching helpers against a specific JSR package.
   */
  export namespace Pkg {
    /** Package-scoped JSR fetch helpers. */
    export type Lib = {
      /**
       * Retrieve the package's latest version and version history.
       */
      versions(name: string, options?: MetadataOptions): Promise<VersionsResponse>;

      /**
       * Retrieve meta-data about a specific package version.
       */
      info(
        name: t.StringPkgName,
        version?: t.StringSemver,
        options?: MetadataOptions,
      ): Promise<InfoResponse>;

      /**
       * Retrieve a fetcher for pulling source-code file data for a specific package/version
       */
      file(
        name: t.StringPkgName,
        version: t.StringSemver,
        options?: Options,
      ): FileFetcher;
    };

    /** Options for the `Jsr.Fetch.<fetch-method>` methods */
    export type Options = {
      /** Cancels the underlying request when the lifecycle ends. */
      until?: t.UntilInput;
    };

    /** Options for registry metadata fetches. */
    export type MetadataOptions = Options & {
      /**
       * Request fresh registry metadata instead of accepting a cached registry view.
       * Defaults to fresh for mutable registry/latest lookups and cached for exact version lookups.
       */
      fresh?: boolean;
    };

    /** Options for the `Jsr.Fetch.<fetch-method>` methods that perform hash checksums on the fetched content. */
    export type ChecksumOptions = Options & { checksum?: t.StringHash };

    /** Response to a `Jsr.Fetch.Pkg.versions` request. */
    export type VersionsResponse = t.FetchResponse<MetaVersions>;

    /** Response to a `Jsr.Fetch.Pkg.info` request. */
    export type InfoResponse = t.FetchResponse<VersionInfo>;

    /** Response to a `Jsr.Fetch.Pkg.file::path()` request. */
    export type FileResponse = t.FetchResponse<string>;

    /**
     * Top level meta-data about a published package including its version history.
     * https://jsr.io/docs/api#package-metadata
     */
    export type MetaVersions = {
      /** Package scope without the leading `@`. */
      scope: string;
      /** Package name within the scope. */
      name: string;
      /** Latest published version reported by JSR. */
      latest: t.StringSemver;
      /** Published versions keyed by version string. */
      versions: { [version: string]: MetaVersion };
    };

    /** Version details about a specific package version. */
    export type MetaVersion = {
      /** Timestamp when JSR created/published the package version. */
      createdAt?: t.StringTimestamp;
      /** True when the version has been yanked from normal resolution. */
      yanked?: boolean;
    };

    /**
     * Meta-data about a specific published package version.
     * https://jsr.io/docs/api#package-version-metadata
     */
    export type VersionInfo = {
      /** The package identity that was requested. */
      readonly pkg: t.Pkg;
      /** Source-file manifest keyed by package-relative path. */
      readonly manifest?: Manifest;
      /** Export map returned by JSR. */
      readonly exports?: { readonly [key: string]: string };
      /** Normalized module graph returned by JSR when available. */
      readonly graph?: Graph;
    };

    /** Normalized JSR module graph used for planning and dependency analysis. */
    export type Graph = {
      /** Upstream graph payload format that produced this normalized graph. */
      readonly format: 1 | 2;
      /** Package modules included in the registry graph payload. */
      readonly modules: readonly GraphModule[];
    };

    /** One module in the normalized JSR package graph. */
    export type GraphModule = {
      /** Package-relative path or module specifier identifying the module. */
      readonly path: string;
      /** Direct imports/dependencies referenced by the module. */
      readonly dependencies: readonly GraphDependency[];
    };

    /** One dependency reference found in a normalized JSR module graph. */
    export type GraphDependency = {
      /** Import specifier as reported by the registry graph payload. */
      readonly specifier: string;
      /** Optional dependency kind when reported by the registry graph payload. */
      readonly kind?: string;
    };

    /**
     * The manifest of the source code file-structure (.ts files) within the package.
     */
    export type Manifest = { [path: string]: ManifestFile };
    /** Meta-data for a single manifest entry. */
    export type ManifestFile = {
      /** File size in bytes. */
      readonly size: number;
      /** Content checksum published by JSR for integrity checks. */
      readonly checksum: string;
    };

    /**
     * File fetching.
     */
    export type FileFetcher = {
      /** The package/version this fetcher is bound to. */
      pkg: t.Pkg;
      /** Retrieve text content for a package-relative path. */
      text(path: t.StringPath, options?: ChecksumOptions): Promise<FileResponse>;
    };
  }
}
