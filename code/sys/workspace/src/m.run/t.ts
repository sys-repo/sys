import type { t } from './common.ts';

/**
 * Canonical workspace task runners.
 */
export declare namespace WorkspaceRun {
  /** Runtime surface for canonical workspace task execution. */
  export type Lib = {
    /** Run `deno task check` across ordered workspace packages. */
    check(args?: Args): Promise<Result>;
    /** Run `deno task test` across ordered workspace packages. */
    test(args?: Args): Promise<Result>;
  };

  /** Shared arguments for one workspace task run. */
  export type Args = {
    /** Working directory for workspace discovery and task execution. */
    readonly cwd?: t.StringDir;
  };

  /** Canonical workspace task names supported by this surface. */
  export type Task = 'check' | 'test';

  /** Successful package task execution. */
  export type PackageRan = {
    readonly kind: 'ran';
    readonly path: t.StringPath;
    readonly code: number;
    readonly success: boolean;
    readonly signal: Deno.Signal | null;
  };

  /** Package skipped because the canonical task is not declared. */
  export type PackageSkipped = {
    readonly kind: 'skipped';
    readonly path: t.StringPath;
    readonly reason: 'task:missing';
  };

  /** One package outcome during a workspace task run. */
  export type PackageResult = PackageRan | PackageSkipped;

  /** Successful workspace task run result. */
  export type Ok = {
    readonly ok: true;
    readonly task: Task;
    readonly cwd: t.StringDir;
    readonly orderedPaths: readonly t.StringPath[];
    readonly packages: readonly PackageResult[];
  };

  /** Failed workspace task run result. */
  export type Fail = {
    readonly ok: false;
    readonly task: Task;
    readonly cwd: t.StringDir;
    readonly orderedPaths: readonly t.StringPath[];
    readonly packages: readonly PackageResult[];
    readonly failure: PackageRan;
  };

  /** Workspace task run result. */
  export type Result = Ok | Fail;
}
