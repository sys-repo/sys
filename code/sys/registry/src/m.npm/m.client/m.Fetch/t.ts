import type { t } from './common.ts';

/**
 * Network fetching helpers against the npm registry end-point.
 */
export declare namespace NpmFetch {
  /** npm fetch helper library surface. */
  export type Lib = {
    /** Package-scoped fetch helpers. */
    readonly Pkg: Pkg.Lib;
    /** npm registry URL helpers. */
    readonly Url: Url.Lib;
  };

  /**
   * Network fetching helpers against a specific npm package.
   */
  export namespace Pkg {
    /** Package-scoped npm fetch helpers. */
    export type Lib = {
      /**
       * Retrieve the package's latest version and version history.
       */
      versions(name: string, options?: Options): Promise<VersionsResponse>;

      /**
       * Retrieve meta-data about a specific package version.
       */
      info(name: string, version?: t.StringSemver, options?: Options): Promise<InfoResponse>;
    };

    /** Options for the `Npm.Fetch.<fetch-method>` methods. */
    export type Options = {
      /** Cancels the underlying request when the lifecycle ends. */
      until?: t.UntilInput;
    };

    /** Response to a `Npm.Fetch.Pkg.versions` request. */
    export type VersionsResponse = t.FetchResponse<MetaVersions>;

    /** Response to a `Npm.Fetch.Pkg.info` request. */
    export type InfoResponse = t.FetchResponse<VersionInfo>;

    /**
     * Top level meta-data about a published package including version history.
     */
    export type MetaVersions = {
      /** Package identity that was requested. */
      name: string;
      /** Latest version reported by the registry. */
      latest: t.StringSemver;
      /** Published versions keyed by version string. */
      versions: { [version: string]: MetaVersion };
    };

    /** Version details about a specific package version. */
    export type MetaVersion = {
      /** True when the version is deprecated in registry metadata. */
      deprecated?: string;
    };

    /**
     * Meta-data about a specific published package version.
     */
    export type VersionInfo = {
      /** The package identity that was requested. */
      pkg: t.Pkg;
      /** Distribution payload metadata. */
      dist?: DistInfo;
      /** Direct runtime dependencies. */
      dependencies?: Record<string, string>;
      /** Direct development dependencies. */
      devDependencies?: Record<string, string>;
      /** Export map or main entry metadata when present. */
      exports?: unknown;
    };

    /** Distribution metadata for a published npm package version. */
    export type DistInfo = {
      /** Tarball URL for the published artifact. */
      tarball?: string;
      /** Published integrity string when present. */
      integrity?: string;
      /** Shasum value when present. */
      shasum?: string;
    };
  }

  /**
   * URL helpers for npm registry package end-points.
   */
  export namespace Url {
    /** npm registry URL helper surface. */
    export type Lib = {
      /** Package-specific URL helpers. */
      readonly Pkg: Pkg.Lib;
    };

    /** URL helpers for a specific npm package. */
    export namespace Pkg {
      /** Package-specific npm registry URL helper surface. */
      export type Lib = {
        /** Package metadata endpoint. */
        metadata(name: string): string;
        /** Specific package version endpoint. */
        version(name: string, version: t.StringSemver): string;
      };
    }
  }
}
