import type { t } from './common.ts';

/**
 * Package metadata sync helpers for @sys monorepos.
 */
export declare namespace MonorepoPkg {
  /** Package metadata sync surface. */
  export type Lib = {
    sync(args: SyncArgs): Promise<SyncResult>;
  };

  /** Include globs that match package `deno.json` files. */
  export type Source = {
    readonly include: readonly t.StringPath[];
  };

  /** Arguments for syncing generated package metadata files. */
  export type SyncArgs = {
    readonly cwd?: t.StringDir;
    readonly source: Source;
    readonly log?: boolean;
  };

  /** Per-package sync outcome. */
  export type PackageResult =
    | {
        readonly kind: 'written';
        readonly packagePath: t.StringPath;
        readonly name: string;
        readonly version: string;
        readonly touched: readonly t.StringPath[];
      }
    | {
        readonly kind: 'unchanged';
        readonly packagePath: t.StringPath;
        readonly name: string;
        readonly version: string;
        readonly touched: readonly t.StringPath[];
      }
    | {
        readonly kind: 'skipped';
        readonly packagePath: t.StringPath;
        readonly name?: string;
        readonly version?: string;
        readonly touched: readonly t.StringPath[];
        readonly reason:
          | 'missing-deno-json'
          | 'missing-name'
          | 'missing-version'
          | 'missing-target-files';
      };

  /** Aggregated package metadata sync result. */
  export type SyncResult = {
    readonly count: number;
    readonly written: number;
    readonly unchanged: number;
    readonly skipped: number;
    readonly touched: readonly t.StringPath[];
    readonly packages: readonly PackageResult[];
  };
}
