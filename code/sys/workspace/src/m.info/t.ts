import type { t } from './common.ts';

/**
 * Workspace source statistics helpers.
 */
export declare namespace WorkspaceInfo {
  /** Source statistics surface. */
  export type Lib = {
    /** Canonical default policy used by workspace info helpers. */
    readonly DEFAULTS: Defaults;
    /** Compute source statistics from include and exclude globs. */
    stats(args: StatsArgs): Promise<StatsResult>;
    /** Format source statistics for console output. */
    fmt(stats: StatsResult): string;
  };

  /** Include and exclude globs for source discovery. */
  export type Source = {
    /** Include globs scanned for source files. */
    readonly include: readonly t.StringPath[];
    /** Optional exclude globs applied to each include glob. */
    readonly exclude?: readonly t.StringPath[];
  };

  /** Optional totals to compute. */
  export type Totals = {
    /** Include an aggregate line count. */
    readonly lines?: boolean;
  };

  /** Arguments for workspace source statistics. */
  export type StatsArgs = {
    /** Working directory used to resolve source globs. */
    readonly cwd?: t.StringDir;
    /** Include and exclude globs for source discovery. */
    readonly source: Source;
    /** Optional totals to compute. */
    readonly totals?: Totals;
  };

  /** Runtime versions included in the stats result. */
  export type Runtime = {
    /** Deno runtime version. */
    readonly deno: string;
    /** TypeScript version bundled with Deno. */
    readonly typescript: string;
    /** V8 version bundled with Deno. */
    readonly v8: string;
  };

  /** Matched line classification kind. */
  export type LineKind = 'source' | 'unit-test' | 'ui-spec-test';

  /** Path classification rule for non-source line kinds. */
  export type TestPathRule = {
    /** Line kind returned when this rule matches. */
    readonly kind: Exclude<LineKind, 'source'>;
    /** Basename patterns that classify a matched file. */
    readonly basenamePatterns?: readonly RegExp[];
    /** Directory segment rules that classify a matched file. */
    readonly directorySegments?: {
      /** Exact directory segment names. */
      readonly exact?: readonly string[];
      /** Directory segment prefixes, including their intended delimiter. */
      readonly prefixes?: readonly string[];
    };
  };

  /** Default workspace info policy. */
  export type Defaults = {
    /** Ordered path classification rules. */
    readonly testPathRules: readonly TestPathRule[];
  };

  /** Matched physical line count partition. */
  export type LineBreakdown = {
    /** Physical lines in matched files not classified as test-owned. */
    readonly source: number;
    /** Physical lines in matched files classified as conventional tests. */
    readonly unitTests: number;
    /** Physical lines in matched files classified as UI/dev-harness specs. */
    readonly uiSpecTests: number;
  };

  /** Aggregate source statistics result. */
  export type StatsResult = {
    /** Runtime versions used for the scan. */
    readonly runtime: Runtime;
    /** Normalized source globs used for the scan. */
    readonly source: {
      /** Include globs scanned for source files. */
      readonly include: readonly t.StringPath[];
      /** Exclude globs applied during discovery. */
      readonly exclude: readonly t.StringPath[];
    };
    /** Number of unique files matched. */
    readonly files: number;
    /** Aggregate line count when requested. */
    readonly lines?: number;
    /** Optional partition of the aggregate line count. */
    readonly lineBreakdown?: LineBreakdown;
  };
}
