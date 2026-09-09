import type { t } from './common.ts';

/**
 * Standard URL generators for the JSR registry.
 */
export declare namespace JsrUrl {
  /** JSR URL helper library surface. */
  export type Lib = {
    /** Registry origin. */
    readonly origin: t.StringUrl;
    /** Package-scoped URL helpers. */
    readonly Pkg: Pkg.Lib;
  };

  /**
   * URLs pertaining to a specific package within the registry.
   */
  export namespace Pkg {
    /** Package-scoped JSR URL helper library surface. */
    export type Lib = {
      /** Package-scoped type predicates. */
      readonly Is: IsLib;

      /** URL for the package's canonical JSR web page. */
      web(name: t.StringPkgName): t.StringUrl;

      /**
       * URL for meta-data information about a package as a whole.
       * https://jsr.io/docs/api#package-metadata
       */
      metadata(name: t.StringPkgName): t.StringUrl;

      /**
       * URL for meta-data about a specific package version.
       */
      version(name: t.StringPkgName, version: t.StringSemver): t.StringUrl;

      /**
       * URL for the source code of a given module file.
       * https://jsr.io/docs/api#modules
       */
      file(name: t.StringPkgName, version: t.StringSemver, path: string): t.StringUrl;
      file(pkg: t.Pkg, path: string): t.StringUrl;

      /**
       * Canonical contract/module refs for a given source path.
       */
      ref(pkg: t.Pkg, contractPath: string, modulePath: string): Ref;
    };

    /** Package-scoped predicate library surface. */
    export type IsLib = {
      /** True when the input is a valid JSR package name, eg `@scope/name`. */
      name(input: unknown): input is t.StringPkgName;
    };
  }

  /**
   * Canonical source URLs linking a package's
   * contract (types) and module (implementation).
   */
  export type Ref = {
    /** Public contract (type surface). */
    readonly contract: t.StringUrl;
    /** The published code module. */
    readonly module: t.StringUrl;
  };
}
