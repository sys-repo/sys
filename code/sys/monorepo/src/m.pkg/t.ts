import type { t } from './common.ts';

/**
 * Package metadata sync helpers for @sys monorepos.
 */
export declare namespace MonorepoPkg {
  /** Package metadata sync surface. */
  export type Lib = {
    sync(args: SyncArgs): Promise<SyncResult>;
  };

  /** Discover packages from a root directory. */
  export type SourceRoot = {
    readonly root: t.StringPath;
  };

  /** Sync an explicit package path list. */
  export type SourcePaths = {
    readonly paths: readonly t.StringPath[];
  };

  /** Package discovery source. */
  export type Source = SourceRoot | SourcePaths;

  /** Generated metadata files to keep aligned per package. */
  export type Target = {
    readonly files: readonly t.StringPath[];
  };

  /** Arguments for syncing generated package metadata files. */
  export type SyncArgs = {
    readonly cwd?: t.StringDir;
    readonly source: Source;
    readonly target: Target;
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
          | 'missing-target-files'
          | 'unsupported-package-shape';
      };

  /** Aggregated package metadata sync result. */
  export type SyncResult = {
    readonly count: number;
    readonly written: number;
    readonly unchanged: number;
    readonly skipped: number;
    readonly packages: readonly PackageResult[];
  };
}
