import type { Pkg as PkgValue } from '@sys/types';
import type { t } from './common.ts';
import type { PkgDistPartInfo } from './t.dist.ts';

export type Pkg = PkgValue;
export type * from './t.dist.ts';

/**
 * Package metadata helper contracts.
 */
export namespace Pkg {
  /**
   * Tools for working with the standard system
   * `{pkg}` package meta-data structure.
   */
  export type Lib = {
    /** Boolean flag tests related to the {pkg} meta-data. */
    readonly Is: Is.Lib;

    /** Canonical package-subpath parsing. */
    readonly Subpath: Subpath.Lib;

    /** Tools for working with distribution packages. */
    readonly Dist: Dist.Lib;

    /** Convert a {pkg} into a display string. */
    toString(input?: t.Pkg, suffix?: string, options?: t.PkgToStringOptions | boolean): string;

    /** Convert a package name, optionally with subpath, to a filesystem namespace segment. */
    toFileNamespace(input: t.Pkg, options?: t.PkgToFileNamespaceOptions): t.StringName;

    /**
     * Extracts the name/version from the given object if found,
     * otherwise returns standard <Unknown> package.
     */
    toPkg(input?: Record<string, unknown> | string): t.Pkg;

    /**
     * Convert a JSON import to a simple <Pkg> structure.
     * @example
     *
     * ```ts
     * import { Pkg } from '@sys/std/pkg';
     * import type { t } from '@sys/std';
     * import { default as deno } from '../deno.json' with { type: 'json' };
     * export const pkg: t.Pkg = Pkg.fromJson(deno);
     * ```
     */
    fromJson(
      input: Record<string, unknown>,
      defaultName?: string,
      defaultVersion?: t.StringSemver,
    ): t.Pkg;

    /**
     * Generate a new { \<unknown\>@0.0.0 } package object.
     */
    unknown(): t.Pkg;
  };

  /**
   * Package-subpath contracts.
   */
  export namespace Subpath {
    /** Canonical package-subpath parsing operations. */
    export type Lib = {
      /** Classify and normalize an optional package subpath without throwing. */
      readonly parse: (input?: unknown) => ParseResult;
    };

    /** Canonical package-subpath parse result. */
    export type ParseResult =
      | { readonly kind: 'absent' }
      | { readonly kind: 'invalid' }
      | { readonly kind: 'valid'; readonly value: string };
  }

  /**
   * Package type-guard contracts.
   */
  export namespace Is {
    /**
     * Boolean tests on a {pkg} structure.
     */
    export type Lib = {
      /** Determines if the input is a string of the default "unknown" */
      unknown(input?: string | t.Pkg): boolean;

      /** Determine if the given input is a `Pkg` */
      pkg(input: unknown): input is t.Pkg;

      /** Determine if the given input is a `DistPkg` */
      dist(input: unknown): input is t.DistPkg;

      /** Determine if the given input is a canonical or legacy `DistPkg` shape. */
      distCompat(input: unknown): input is t.DistPkg | t.DistPkgLegacy;
    };
  }

  /**
   * Distribution package helper contracts.
   */
  export namespace Dist {
    /**
     * Tools for working with "distribution-package"
     * ie. an ESM output typically written to a `/dist` folder.
     */
    export type Lib = {
      /** Type guards. */
      readonly Is: Is.Lib;

      /** Legacy-compatibility helpers for dist schema evolution. */
      readonly Compat: Compat.Lib;

      /**
       * Helpers for parsing `dist.hash.parts` values, eg:
       *   "sha256-<hex>:size=<bytes>"
       *   "sha256-<hex>"
       */
      readonly Part: Part.Lib;
    };

    /**
     * Type-guard contracts.
     */
    export namespace Is {
      /**
       * Type guards.
       */
      export type Lib = {
        /** Determine if the given path represents a commonly known /pkg/ path pattern. */
        codePath(path: t.StringPath): boolean;
      };
    }

    /**
     * Dist hash-part helper contracts.
     */
    export namespace Part {
      /**
       * Helpers for working with `dist.hash.parts`.
       */
      export type Lib = {
        /** Parse a parts value into `{ hash, size }` if possible. */
        parse(value: unknown): PkgDistPartInfo | undefined;

        /** Extract only the hash (if any). */
        hash(value: unknown): t.StringHash | undefined;

        /** Extract only the size (bytes) (if any). */
        size(value: unknown): number | undefined;
      };
    }

    /**
     * Distribution package compatibility helper contracts.
     */
    export namespace Compat {
      /**
       * Compatibility helpers for legacy `dist.json` shapes.
       */
      export type Lib = {
        /** Determine if the given input is legacy (compat) shape (not canonical). */
        legacy(input: unknown): input is t.DistPkgLegacy;

        /**
         * Convert legacy/canonical input to canonical `DistPkg`.
         * Legacy input requires explicit `policy`.
         */
        toCanonical(
          input: unknown,
          options?: { policy?: t.StringUri },
        ): t.DistPkg | undefined;
      };
    }
  }
}

/** Options passed to the `Pkg.toString` method. */
export type PkgToStringOptions = {
  /** Include the version in the display string - @default true */
  version?: boolean;
};

/** Options passed to the `Pkg.toFileNamespace` method. */
export type PkgToFileNamespaceOptions = {
  /** Optional package subpath appended after the package name. */
  subpath?: t.StringPath;
};
