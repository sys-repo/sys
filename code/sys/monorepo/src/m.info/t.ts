import type { t } from './common.ts';

/**
 * Monorepo source statistics helpers.
 */
export declare namespace MonorepoInfo {
  /** Source statistics surface. */
  export type Lib = {
    stats(args: StatsArgs): Promise<StatsResult>;
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

  /** Aggregate source statistics result. */
  export type StatsResult = {
    readonly source: {
      readonly include: readonly t.StringPath[];
      readonly exclude: readonly t.StringPath[];
    };
    readonly files: number;
    readonly lines?: number;
  };
}
