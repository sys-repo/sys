import type { t } from './common.ts';

/**
 * Type namespace for small deterministic path-glob matching.
 */
export declare namespace Glob {
  /**
   * Small deterministic matcher for path-like strings.
   */
  export type Lib = {
    /** True when the pattern or pattern list matches the path. */
    readonly matches: (pattern: Pattern | undefined, path: Path) => boolean;
  };

  /** Glob pattern or ordered list of glob patterns. */
  export type Pattern = t.StringGlob | readonly t.StringGlob[];

  /** Path-like string to test against a glob pattern. */
  export type Path = t.StringPath;
}
