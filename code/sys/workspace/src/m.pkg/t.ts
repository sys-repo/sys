import type { t } from './common.ts';

/**
 * Package metadata sync helpers for multi-package repositories.
 */
export declare namespace WorkspacePkg {
  /** Package metadata sync surface. */
  export type Lib = {
    /** Sync generated package metadata files across matching packages. */
    sync(args: SyncArgs): Promise<SyncResult>;
  };

  /** Include globs that match package `deno.json` files. */
  export type Source = {
    /** Include globs used to discover package manifests. */
    readonly include: readonly t.StringPath[];
  };

  /** Arguments for syncing generated package metadata files. */
  export type SyncArgs = {
    /** Working directory used to resolve package globs. */
    readonly cwd?: t.StringDir;
    /** Package manifest discovery globs. */
    readonly source: Source;
    /** Emit sync logging to the console. */
    readonly log?: boolean;
  };

  /** Per-package sync outcome. */
  export type PackageResult =
    | {
        /** Package metadata files were updated. */
        readonly kind: 'written';
        /** Package root path. */
        readonly packagePath: t.StringPath;
        /** Package name from `deno.json`. */
        readonly name: string;
        /** Package version from `deno.json`. */
        readonly version: string;
        /** Generated metadata files touched for the package. */
        readonly touched: readonly t.StringPath[];
      }
    | {
        /** Package metadata files were already up to date. */
        readonly kind: 'unchanged';
        /** Package root path. */
        readonly packagePath: t.StringPath;
        /** Package name from `deno.json`. */
        readonly name: string;
        /** Package version from `deno.json`. */
        readonly version: string;
        /** Generated metadata files checked for the package. */
        readonly touched: readonly t.StringPath[];
      }
    | {
        /** Package metadata sync was skipped. */
        readonly kind: 'skipped';
        /** Package root path. */
        readonly packagePath: t.StringPath;
        /** Package name when available. */
        readonly name?: string;
        /** Package version when available. */
        readonly version?: string;
        /** Generated metadata files touched for the package. */
        readonly touched: readonly t.StringPath[];
        /** Reason the package was skipped. */
        readonly reason:
          | 'missing-deno-json'
          | 'missing-name'
          | 'missing-version'
          | 'missing-target-files';
      };

  /** Aggregated package metadata sync result. */
  export type SyncResult = {
    /** Number of packages processed. */
    readonly count: number;
    /** Number of packages whose metadata files changed. */
    readonly written: number;
    /** Number of packages already up to date. */
    readonly unchanged: number;
    /** Number of packages skipped. */
    readonly skipped: number;
    /** All generated metadata files touched across packages. */
    readonly touched: readonly t.StringPath[];
    /** Per-package sync outcomes. */
    readonly packages: readonly PackageResult[];
  };
}
