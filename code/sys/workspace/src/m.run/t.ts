import type { t } from './common.ts';

/**
 * Canonical workspace task runners.
 */
export declare namespace WorkspaceRun {
  /** Runtime surface for canonical workspace task execution. */
  export type Lib = {
    /** Typed argument helpers for workspace task runners. */
    readonly Args: Args.Lib;
    /** Result formatter helpers for workspace task runs. */
    readonly Fmt: Fmt.Lib;
    /** Run `deno task check` across ordered workspace packages. */
    check(args?: Args): Promise<Result>;
    /** Run package dry runs across ordered workspace packages. */
    dry(args?: Args): Promise<Result>;
    /** Run `deno task test` across ordered workspace packages. */
    test(args?: Test.Args): Promise<Result>;
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
    readonly filter?: Filter.Predicate;
  };

  /** Typed argument helper contracts for workspace task runners. */
  export namespace Args {
    export type Lib = {
      /** Parse CLI argv into canonical test-runner arguments. */
      test(argv?: readonly string[]): Test.Args;
    };
  }

  /** Test-runner-specific contracts. */
  export namespace Test {
    /** Arguments for the canonical workspace test runner. */
    export type Args = WorkspaceRun.Args & {
      /** Optional execution strategy. Defaults to the baseline sequential runner. */
      readonly strategy?: Strategy;
    };

    /** Workspace package execution strategy for test runs. */
    export type Strategy = Strategy.Sequential | Strategy.Parallel;

    /** Test execution strategy contracts. */
    export namespace Strategy {
      /** Baseline graph-order runner with inherited child stdio and immediate fail-fast. */
      export type Sequential = {
        readonly kind: 'sequential';
      };

      /** Topology-safe parallel test runner. */
      export type Parallel = {
        readonly kind: 'parallel';
        /** Maximum number of package tasks to run at once. */
        readonly jobs?: Jobs;
      };

      /** Concrete parallel worker bound or the default hardware-aware heuristic. */
      export type Jobs = number | 'auto';
    }
  }

  /** Workspace package filtering contracts. */
  export namespace Filter {
    /** One package candidate exposed to workspace task filters. */
    export type Entry = {
      /** Workspace-relative package directory. */
      readonly dir: t.StringDir;
      /** Canonical package identity loaded from the package manifest. */
      readonly pkg: t.Pkg;
      /** Canonical task being executed for this run. */
      readonly task: Task;
    };

    /** Predicate used to include package candidates in one workspace task run. */
    export type Predicate = (entry: Entry) => boolean;
  }

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
      /** Captured stdout for buffered runners. Undefined when stdio is inherited. */
      readonly stdout?: string;
      /** Captured stderr for buffered runners. Undefined when stdio is inherited. */
      readonly stderr?: string;
    };

    /** Package skipped because the canonical task is not declared. */
    export type Skipped = {
      readonly kind: 'skipped';
      readonly path: t.StringPath;
      readonly reason: 'task:missing';
    };

    /** Package blocked before launch because fail-fast stopped the frontier. */
    export type Blocked = {
      readonly kind: 'blocked';
      readonly path: t.StringPath;
      readonly reason: 'dependency:failed' | 'fail-fast';
    };

    /** One package outcome during a workspace task run. */
    export type Result = Ran | Skipped | Blocked;
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

/**
 * Completion-hang diagnostics for process-owning workspace run callers.
 */
export declare namespace CompletionHang {
  /** Runtime surface for warning when a completed run leaves the process alive. */
  export type Lib = {
    /** Arm a one-shot post-completion hang warning. */
    armWarning(input: ArmInput): Armed;
    /** Format a post-completion hang warning. */
    formatWarning(input: FormatInput): string;
  };

  /** Input for arming a post-completion hang warning. */
  export type ArmInput = FormatInput & {
    /** Output sink for the warning. Defaults to `console.info`. */
    readonly write?: (text: string) => void;
    /** Timer dependencies for tests and runtime adaptation. */
    readonly deps?: Deps;
  };

  /** Input for formatting a post-completion hang warning. */
  export type FormatInput = {
    /** Completed workspace run result. */
    readonly result: WorkspaceRun.Result;
    /** Run strategy context when known by the process-owning caller. */
    readonly strategy?: StrategyContext;
    /** Delay before the warning is emitted. */
    readonly delay?: t.Msecs;
    /** Optional package identity context keyed by workspace path. */
    readonly packages?: readonly PackageContext[];
    /** Maximum number of package rows to include. */
    readonly contextLimit?: number;
  };

  /** Strategy context rendered in the warning. */
  export type StrategyContext = WorkspaceRun.Test.Strategy | {
    readonly kind: 'parallel';
    readonly jobs: number;
  };

  /** Optional package identity context for warning rows. */
  export type PackageContext = {
    readonly path: t.StringPath;
    readonly name?: string;
  };

  /** Armed warning handle. */
  export type Armed = {
    /** Cancel the pending warning. */
    readonly cancel: () => void;
  };

  /** Timer dependencies used by the warning arm. */
  export type Deps = {
    /** Schedule the one-shot warning callback. */
    readonly setTimeout: (fn: () => void, delay: number) => number;
    /** Clear a scheduled warning callback. */
    readonly clearTimeout: (id: number) => void;
    /** Release the timer from process-liveness retention. */
    readonly unrefTimer: (id: number) => void;
  };
}
