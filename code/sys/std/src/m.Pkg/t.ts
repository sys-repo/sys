import type { Pkg as PkgValue } from '@sys/types';
import type { t } from './common.ts';
import type { PkgDistPartInfo } from './t.dist.ts';

export type Pkg = PkgValue;
export type * from './t.dist.ts';

/**
 * Package names, versions, and distribution metadata.
 */
export declare namespace Pkg {
  /** Parse, format, and validate package metadata. */
  export type Lib = {
    /** Package metadata type guards. */
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
   * Parse package subpaths.
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
   * Package metadata type guards.
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

      /**
       * Check a plain record with exactly one own data property, `dist.json`, holding a canonical
       * SHA-256 checksum. Does not read or verify the manifest.
       */
      distPin(input: unknown): input is t.DistPin;

      /** Determine if the given input is a canonical or legacy `DistPkg` shape. */
      distCompat(input: unknown): input is t.DistPkg | t.DistPkgLegacy;
    };
  }

  /**
   * Distribution manifests.
   */
  export namespace Dist {
    /** Parse distribution metadata and validate named pins. */
    export type Lib = {
      /** Type guards. */
      readonly Is: Is.Lib;

      /** Validate and copy named distribution pins. */
      readonly Pins: Pins.Lib;

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
     * Named distribution pin validation.
     */
    export namespace Pins {
      /** Validate pins without reading their files. */
      export type Lib = { readonly capture: Capture };

      /**
       * Return frozen copies of a nonempty pins-only record.
       * When requirements are supplied, pin names must match them exactly.
       * Invalid input throws `TypeError('Invalid Dist pins.')`.
       */
      export type Capture = {
        (input: unknown): t.DistPins;
        <const N extends string>(input: unknown, requirements: Requirements<N>): t.DistPins<N>;
      };

      /** An exhaustive, nonempty witness of the exact distribution names required by the consumer. */
      export type Requirements<N extends string> = {
        readonly names: Readonly<Record<N, true>>;
      };
    }

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
     * File hashes and sizes recorded in a distribution manifest.
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
     * Read and convert legacy distribution metadata.
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
