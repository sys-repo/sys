import type { t } from './common.ts';

/**
 * Media-type resolution, parsing, formatting, and classification contracts.
 */
export declare namespace MediaType {
  /** Canonical media-type authority. */
  export type Lib = {
    /** Resolve a bare media type from a file extension. */
    readonly fromExtension: Resolve.FromExtension;

    /** Resolve a bare media type from the final extension of a path. */
    readonly fromPath: Resolve.FromPath;

    /** Extract and normalize the bare media type from an RFC 2397 data URI. */
    readonly fromDataUri: (uri: t.StringUri) => t.StringMimeType | undefined;

    /** Format a valid media type as a Content-Type header value. */
    readonly toContentType: (mediaType: string) => t.StringContentType | undefined;

    /** Media-type predicates. */
    readonly Is: Is.Lib;

    /** Explicit caller-selected fallback values. */
    readonly Fallback: Fallback.Lib;
  };

  /**
   * Media-type resolution contracts.
   */
  export namespace Resolve {
    /** Named extension-resolution policy. */
    export type Profile = 'standard' | 'source';

    /** Resolve a bare media type from a file extension. */
    export type FromExtension = (
      extension: string,
      options?: Options,
    ) => t.StringMimeType | undefined;

    /** Resolve a bare media type from the final extension of a path. */
    export type FromPath = (
      path: t.StringPath,
      options?: Options,
    ) => t.StringMimeType | undefined;

    /** Options for extension and path resolution. */
    export type Options = { profile?: Profile };
  }

  /**
   * Media-type predicate contracts.
   */
  export namespace Is {
    /** Media-type predicate surface. */
    export type Lib = {
      /** Determine whether the input has valid media-type syntax. */
      readonly valid: (input?: unknown) => boolean;

      /** Determine whether a valid media type represents text-like content. */
      readonly text: (input?: unknown) => boolean;

      /** Determine whether a valid media type represents binary content. */
      readonly binary: (input?: unknown) => boolean;
    };
  }

  /**
   * Explicit fallback contracts.
   */
  export namespace Fallback {
    /** Canonical fallback values selected by callers. */
    export type Lib = {
      /** Binary content fallback. */
      readonly binary: 'application/octet-stream';

      /** Text content fallback. */
      readonly text: 'text/plain';
    };
  }
}
