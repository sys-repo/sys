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

    /** Normalize package subpaths without granting filesystem authority. */
    readonly Subpath: Subpath.Lib;

    /** Tools for working with distribution packages. */
    readonly Dist: Dist.Lib;

    /** Format `name@version` with an optional `:suffix`; the version can be omitted. */
    toString(input?: t.Pkg, suffix?: string, options?: t.PkgToStringOptions | boolean): string;

    /**
     * Convert a name and optional subpath to a dotted namespace, e.g. `@sys/model/files` →
     * `@sys.model.files`. Throws for invalid names or invalid string subpaths.
     */
    toFileNamespace(input: t.Pkg, options?: t.PkgToFileNamespaceOptions): t.StringName;

    /**
     * Copy string `name` and `version` fields from an object, or parse a `name@version` string
     * (including scoped names). Returns `Pkg.unknown()` when either field cannot be obtained.
     * Does not validate package-name or semantic-version syntax.
     */
    toPkg(input?: Record<string, unknown> | string): t.Pkg;

    /**
     * Read `name` and `version` from an object, filling missing or non-string fields individually.
     * Each field uses its supplied default, then the corresponding `Pkg.unknown()` value.
     * Non-record input returns `Pkg.unknown()` without applying supplied defaults.
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

    /** Return a fresh `{ name: '<unknown>', version: '0.0.0' }` object. */
    unknown(): t.Pkg;
  };

  /**
   * Parse package subpaths.
   */
  export namespace Subpath {
    /** Package-subpath normalization and classification. */
    export type Lib = {
      /**
       * Normalize without throwing: ` //ui///admin// ` → `ui/admin`.
       * Control/format characters, lone surrogates and Unicode line/paragraph separators are
       * invalid, even in otherwise empty input. Non-strings other than `undefined` are invalid.
       * `undefined` or text that normalizes to no segments is absent; other accepted text is valid.
       * Validity does not establish filesystem safety: `./ui/../admin` and `ui\admin` are accepted.
       */
      readonly parse: (input?: unknown) => ParseResult;
    };

    /** Absence, invalid input, or a normalized nonempty subpath. */
    export type ParseResult =
      | { readonly kind: 'absent' }
      | { readonly kind: 'invalid' }
      | { readonly kind: 'valid'; readonly value: string };
  }

  /**
   * Package metadata type guards.
   */
  export namespace Is {
    /** Package metadata and distribution shape checks. */
    export type Lib = {
      /**
       * Recognize `<unknown>@0.0.0`, its package object, or missing/non-string package metadata.
       * Other strings return false; this is not a package-validity check.
       */
      unknown(input?: string | t.Pkg): boolean;

      /** Check for string `name` and `version` fields. */
      pkg(input: unknown): input is t.Pkg;

      /** Recognize supported manifest shape; does not recompute identity or verify payload bytes. */
      dist(input: unknown): input is t.DistPkg;

      /**
       * Check exactly two own data properties: the supported `scheme` and canonical SHA-256
       * `digest`. Validating this shape does not establish that the digest came from a trusted source.
       */
      distPin(input: unknown): input is t.DistPin;
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

      /** Encode the file inventory for the distribution content hash. */
      readonly Content: Content.Lib;

      /** Parse file checksums and optional byte sizes from `dist.hash.parts` values. */
      readonly Part: Part.Lib;
    };

    /**
     * Named distribution pin validation.
     */
    export namespace Pins {
      /** Validate pins without reading their files. */
      export type Lib = { readonly capture: Capture };

      /**
       * Accept `{ pins: { [name]: pin } }` with nonempty pins and no other top-level fields.
       * When supplied, `requirements.names` must match the pin names exactly.
       * Return frozen copies unaffected by subsequent caller mutation.
       * Invalid input throws `TypeError('Invalid Dist pins.')`.
       */
      export type Capture = {
        (input: unknown): t.DistPins;
        <const N extends string>(input: unknown, requirements: Requirements<N>): t.DistPins<N>;
      };

      /** Exact, nonempty set of required distribution names. */
      export type Requirements<N extends string> = {
        readonly names: Readonly<Record<N, true>>;
      };
    }

    /**
     * Type-guard contracts.
     */
    export namespace Is {
      /** Path-shape checks. */
      export type Lib = {
        /** Check for a `pkg/` directory segment at the start or after `/`; `pkg` alone is false. */
        codePath(path: t.StringPath): boolean;
      };
    }

    /**
     * File hashes and sizes recorded in a distribution manifest.
     */
    export namespace Part {
      /** File-checksum and byte-size parsing. */
      export type Lib = {
        /**
         * Parse `sha256-<64 lowercase hex digits>` with an optional `:size=<bytes>` suffix.
         * Sizes must be nonnegative safe integers in canonical decimal notation (`0` or no leading
         * zeros). The whole input must match; otherwise returns `undefined`.
         * Hash-only values are accepted here but are insufficient for `Content.encode`.
         */
        parse(value: unknown): PkgDistPartInfo | undefined;

        /** Return the parsed hash; malformed sizes invalidate the whole input, including its hash. */
        hash(value: unknown): t.StringHash | undefined;

        /** Return the parsed byte size, or `undefined` for invalid input or an absent size. */
        size(value: unknown): number | undefined;
      };
    }

    /**
     * Encode the file inventory for the distribution content hash.
     */
    export namespace Content {
      /** Supported scheme, input limits and inventory encoding. */
      export type Lib = {
        readonly scheme: t.DistScheme;
        readonly limits: Readonly<Limits>;
        /**
         * Requires a nonempty file inventory with nonempty Unicode scalar paths and canonical
         * SHA-256 parts with byte sizes (see `Part.parse`).
         *
         * Returns compact JSON `[scheme, [[path, sha256, size], ...]]`, sorted by exact UTF-16
         * code units. Uses native JSON escaping, with no normalization or trailing newline.
         * The returned string's UTF-8 bytes are the input to the content hash.
         *
         * Throws `TypeError` for malformed input and `RangeError` when `limits` are exceeded.
         * Does not hash or read files, validate portable paths, or verify a claimed digest.
         */
        encode(parts: t.DistContent['parts']): string;
      };

      /** Limits checked before sorting and serialization; callers may impose lower limits. */
      export type Limits = {
        /** Maximum number of file entries. */
        readonly entries: number;
        /** Maximum UTF-16 code units per exact path. */
        readonly pathLength: number;
        /** Maximum aggregate UTF-16 path code units. */
        readonly pathTotal: number;
        /** Maximum conservative estimate of UTF-8 output size; not a runtime memory-allocation cap. */
        readonly encodedBytes: number;
      };
    }
  }
}

/** Options passed to the `Pkg.toString` method. */
export type PkgToStringOptions = {
  /** Include the version in the display string. Defaults to `true`. */
  version?: boolean;
};

/** Options passed to the `Pkg.toFileNamespace` method. */
export type PkgToFileNamespaceOptions = {
  /** Optional package subpath appended after the package name. */
  subpath?: t.StringPath;
};
