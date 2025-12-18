import type { t } from './common.ts';

/**
 * Text query filtering primitives.
 */
export namespace Filter {
  /**
   * Public library surface.
   * Stable API; implementation may evolve.
   */
  export type Lib = {
    /** Normalize raw query input into a query structure. */
    readonly parse: ParseFn;

  };

  /** Raw user query input. */
  export type QueryInput = string;

  /** Normalized query representation. */
  export type Query = {
    readonly text: string;
    readonly tokens?: readonly string[];
  };

  /** A value paired with text used for matching. */
  export type Candidate<T = unknown> = {
    readonly text: string;
    readonly value: T;
  };

  /** Character range of a match within text. */
  export type Range = {
    readonly start: t.Index;
    readonly end: t.Index;
  };

  /** Match result for a candidate. */
  export type Result<T = unknown> = {
    readonly text: string;
    readonly value: T;
    readonly match: boolean;
    readonly score: number;
    readonly ranges?: readonly Range[];
  };

  /** Matching and scoring options. */
  export type Options = {
    readonly mode?: 'contains' | 'fuzzy';
    readonly caseSensitive?: boolean;
    readonly pathAware?: boolean;
    readonly limit?: t.Index;
  };

  /** Normalize a raw query into a structured form. */
  export type ParseFn = (query: QueryInput, options?: Options) => Query;

  /** Match a query against a single string. */
  export type MatchFn = (query: QueryInput | Query, text: string, options?: Options) => MatchResult;
  export type MatchResult = {
    readonly match: boolean;
    readonly score: number;
    readonly ranges?: readonly Range[];
  };

  /** Apply a query across a candidate set. */
  export type ApplyFn = <T>(
    query: QueryInput | Query,
    candidates: readonly Candidate<T>[],
    options?: Options,
  ) => readonly Result<T>[];
}
