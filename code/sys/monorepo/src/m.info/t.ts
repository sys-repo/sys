import type { t } from './common.ts';

/**
 * Monorepo source statistics helpers.
 */
export declare namespace MonorepoInfo {
  /** Source statistics surface. */
  export type Lib = {
    stats(args: StatsArgs): Promise<StatsResult>;
    fmt(stats: StatsResult): string;
  };

  /** Include and exclude globs for source discovery. */
  export type Source = {
    readonly include: readonly t.StringPath[];
    readonly exclude?: readonly t.StringPath[];
  };

  /** Optional totals to compute. */
  export type Totals = {
    readonly lines?: boolean;
  };

  /** Arguments for monorepo source statistics. */
  export type StatsArgs = {
    readonly cwd?: t.StringDir;
    readonly source: Source;
    readonly totals?: Totals;
  };

  /** Runtime versions included in the stats result. */
  export type Runtime = {
    readonly deno: string;
    readonly typescript: string;
    readonly v8: string;
  };

  /** Aggregate source statistics result. */
  export type StatsResult = {
    readonly runtime: Runtime;
    readonly source: {
      readonly include: readonly t.StringPath[];
      readonly exclude: readonly t.StringPath[];
    };
    readonly files: number;
    readonly lines?: number;
  };
}
