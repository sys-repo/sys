import type { t } from './common.ts';

/**
 * Bounded, root-relative, POSIX-visible resource path types.
 */
export declare namespace PathBounded {
  /** Helpers for bounded, root-relative, POSIX-visible resource paths. */
  export type Lib = {
    readonly Is: {
      /** True when the input starts with a Windows drive prefix such as `C:`. */
      readonly windowsDrive: (input: t.StringPath) => boolean;
    };

    /**
     * Canonicalize a path for safe visibility inside a bounded resource tree.
     *
     * Empty, `undefined`, and `.` resolve to the bounded root (`''`).
     * Rejects absolute paths, Windows-drive paths, NUL, backslashes, and `..` traversal.
     */
    readonly visible: (ops: Ops, input: unknown, invalid?: Invalid) => t.StringRelativePath;

    /** Canonicalize input as a bounded-visible POSIX path, then return its parent. */
    readonly parent: (input: t.StringRelativePath, invalid?: Invalid) => t.StringRelativePath;

    /** Frozen string-only POSIX operations for structural resource trees, not host paths. */
    readonly posix: () => PosixOps;
  };

  /** Path operations required by bounded-path canonicalization. */
  export type Ops = {
    readonly isAbsolute: (path: t.StringPath) => boolean;
    readonly normalize: (path: t.StringPath) => t.StringPath;
  };

  /**
   * POSIX structural path operations for virtual/bounded resource trees.
   * These are string-only operations, not host filesystem or realpath semantics.
   */
  export type PosixOps = Ops & {
    readonly join: (...parts: readonly string[]) => t.StringPath;
    readonly resolve: (...parts: readonly string[]) => t.StringAbsolutePath;
    readonly relative: (from: t.StringPath, to: t.StringPath) => t.StringRelativePath;
  };

  /** Error factory for domain-specific bounded path failures. */
  export type Invalid = (message: string) => Error;
}
