import type { t } from './common.ts';

/**
 * Workspace source statistics helpers.
 */
export declare namespace WorkspaceInfo {
  /** Source statistics surface. */
  export type Lib = {
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
  };
}
