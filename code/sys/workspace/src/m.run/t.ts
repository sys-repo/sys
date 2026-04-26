import type { t } from './common.ts';

/**
 * Canonical workspace task runners.
 */
export declare namespace WorkspaceRun {
  /** Runtime surface for canonical workspace task execution. */
  export type Lib = {
    /** Result formatter helpers for workspace task runs. */
    readonly Fmt: Fmt.Lib;
    /** Run `deno task check` across ordered workspace packages. */
    check(args?: Args): Promise<Result>;
    /** Run package dry runs across ordered workspace packages. */
    dry(args?: Args): Promise<Result>;
    /** Run `deno task test` across ordered workspace packages. */
    test(args?: Args): Promise<Result>;
  };

  /** Shared arguments for one workspace task run. */
  export type Args = {
    /** Working directory for workspace discovery and task execution. */
    readonly cwd?: t.StringDir;
    /** Optional pre-resolved persisted workspace graph. */
    readonly graph?: t.WorkspaceGraph.PersistedGraph;
    /** Force rebuilding the workspace graph instead of reading the cached snapshot first. */
    readonly rebuildGraph?: boolean;
    /** Optional package filter applied in graph order before task execution. */
    readonly filter?: Filter;
  };

  /** One package candidate exposed to workspace task filters. */
  export type FilterEntry = {
    /** Workspace-relative package directory. */
    readonly dir: t.StringDir;
    /** Canonical package identity loaded from the package manifest. */
    readonly pkg: t.Pkg;
    /** Canonical task being executed for this run. */
    readonly task: Task;
  };

  /** Predicate used to include package candidates in one workspace task run. */
  export type Filter = (entry: FilterEntry) => boolean;

  /** Canonical workspace task names supported by this surface. */
  export type Task = 'check' | 'dry' | 'test';

  /** Package-level outcomes during one workspace task run. */
  export namespace Package {
    /** Successful package task execution. */
    export type Ran = {
      readonly kind: 'ran';
      readonly path: t.StringPath;
      readonly code: number;
      readonly success: boolean;
      readonly signal: Deno.Signal | null;
      readonly elapsed: t.Msecs;
    };

    /** Package skipped because the canonical task is not declared. */
    export type Skipped = {
      readonly kind: 'skipped';
      readonly path: t.StringPath;
      readonly reason: 'task:missing';
    };

    /** One package outcome during a workspace task run. */
    export type Result = Ran | Skipped;
  }

  /** Successful workspace task run result. */
  export type Ok = {
    readonly ok: true;
    readonly task: Task;
    readonly cwd: t.StringDir;
    readonly elapsed: t.Msecs;
    readonly orderedPaths: readonly t.StringPath[];
    readonly packages: readonly Package.Result[];
  };

  /** Failed workspace task run result. */
  export type Fail = {
    readonly ok: false;
    readonly task: Task;
    readonly cwd: t.StringDir;
    readonly elapsed: t.Msecs;
    readonly orderedPaths: readonly t.StringPath[];
    readonly packages: readonly Package.Result[];
    readonly failure: Package.Ran;
  };

  /** Workspace task run result. */
  export type Result = Ok | Fail;

  /** Formatter helpers for workspace task run results. */
  export namespace Fmt {
    export type Lib = {
      /** Format the overall run summary and package rows for console output. */
      result(result: Result): string;
      /** Format package-level rows only for console output. */
      packages(result: Result): string;
    };
  }
}
