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
    cwd?: t.StringDir;
    /** Optional pre-resolved persisted workspace graph. */
    graph?: t.WorkspaceGraph.PersistedGraph;
    /** Force rebuilding the workspace graph instead of reading the cached snapshot first. */
    rebuildGraph?: boolean;
    /** Optional package filter applied in graph order before task execution. */
    filter?: Filter.Predicate;
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
      strategy?: Strategy;
      /** Parallel progress reporter mode. Omission preserves stdout-terminal auto-detection. */
      reporter?: Reporter.Mode | Reporter.Screen;
    };

    /** Parallel test progress reporter contracts. */
    export namespace Reporter {
      /** Explicit parallel reporter mode. */
      export type Mode = 'screen' | 'log';

      /** Screen reporter input with final scrollback visibility. */
      export type Screen = {
        mode: 'screen';
        onComplete(completion: ScreenCompletion): void;
      };

      /** Failed-action visibility after final screen output enters scrollback. */
      export type ScreenCompletion = {
        readonly failedPackages: {
          /** Graph-ordered failed-package actions visible in final scrollback. */
          readonly visible: number;
          /** Total failed-package actions retained by the reporter. */
          readonly total: number;
        };
      };
    }

    /** Workspace package execution strategy for test runs. */
    export type Strategy = Strategy.Sequential | Strategy.Parallel;

    /** Native test-runner stats collected after a package test run. */
    export namespace Stats {
      /** Capability-tagged package-level native stats result. */
      export type Result = Observed | Unavailable | Unsupported;

      /** Native stats capability currently supported by the workspace runner. */
      export type Capability = 'deno:junit';

      /** Structured stats source for observed native test facts. */
      export type Source = 'junit';

      /** Final native facts observed from a structured report. */
      export type Observed = {
        readonly kind: 'observed';
        readonly capability: Capability;
        readonly source: Source;
        /** Number of observed JUnit testcase elements. */
        readonly tests: number;
        /** Failed native test cases, including both failures and errors. */
        readonly failed: number;
        /** Native test cases with JUnit failure elements. */
        readonly failures: number;
        /** Native test cases with JUnit error elements. */
        readonly errors: number;
        /** Native test cases with JUnit skipped elements. */
        readonly skipped: number;
        /** Sum of testcase durations when reported by the source artifact. */
        readonly duration?: t.Msecs;
        /** Failed native test case identities when reported by the source artifact. */
        readonly failedCases: readonly FailedCase[];
        /** Non-fatal parser warnings for lossy or inconsistent report data. */
        readonly warnings: readonly string[];
      };

      /** One failed native testcase identity from a structured report. */
      export type FailedCase = {
        readonly kind: 'failure' | 'error';
        readonly name: string;
        readonly className?: string;
        readonly message?: string;
      };

      /** Stats collection was applicable but the report could not be observed. */
      export type Unavailable = {
        readonly kind: 'unavailable';
        readonly capability: Capability;
        readonly source: Source;
        readonly reason: UnavailableReason;
        readonly message?: string;
      };

      /** Stats collection was not safe or meaningful for this package task shape. */
      export type Unsupported = {
        readonly kind: 'unsupported';
        readonly capability: 'none';
        readonly reason: UnsupportedReason;
        readonly command?: string;
      };

      /** Why an otherwise supported native stats source was unavailable. */
      export type UnavailableReason =
        | 'temp:create-failed'
        | 'report:missing'
        | 'report:read-failed'
        | 'report:parse-failed';

      /** Why a package task was not instrumented for native stats. */
      export type UnsupportedReason =
        | 'task:empty'
        | 'task:parse-failed'
        | 'task:composite'
        | 'task:not-native-deno-test'
        | 'task:existing-junit-path'
        | 'task:unsupported-args'
        | 'command:not-deno-task';
    }

    /** Test execution strategy contracts. */
    export namespace Strategy {
      /** Concrete parallel worker bound or the default hardware-aware heuristic. */
      export type Jobs = number | 'auto';

      /** Baseline graph-order runner with inherited child stdio and immediate fail-fast. */
      export type Sequential = {
        kind: 'sequential';
      };

      /** Topology-safe parallel test runner. */
      export type Parallel = {
        kind: 'parallel';
        /** Maximum number of package tasks to run at once. */
        jobs?: Jobs;
      };
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
    /** Canonical identity retained for one selected workspace package. */
    export type Identity = {
      /** Canonical package name loaded from `deno.json`. */
      readonly name: t.StringPkgName;
      /** Workspace-relative package directory. */
      readonly path: t.StringPath;
    };

    /** Completed package task execution. */
    export type Ran = Identity & {
      readonly kind: 'ran';
      readonly code: number;
      readonly success: boolean;
      readonly signal: Deno.Signal | null;
      readonly elapsed: t.Msecs;
      /** Captured stdout for buffered runners. Undefined when stdio is inherited. */
      readonly stdout?: string;
      /** Captured stderr for buffered runners. Undefined when stdio is inherited. */
      readonly stderr?: string;
      /** Native Deno test stats for package test tasks when collection was attempted. */
      readonly testStats?: WorkspaceRun.Test.Stats.Result;
    };

    /** Package skipped because the canonical task is not declared. */
    export type Skipped = Identity & {
      readonly kind: 'skipped';
      readonly reason: 'task:missing';
    };

    /** Package blocked before launch because fail-fast stopped the frontier. */
    export type Blocked = Identity & {
      readonly kind: 'blocked';
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
      /** Format one aligned, width-safe runner intro line. */
      introLine(label: string, message: string, options?: IntroLineOptions): string;
      /** Format a compact or full final handoff for one completed run. */
      handoff(result: Result, options: HandoffOptions): string;
      /** Format the overall run summary and package rows for console output. */
      result(result: Result): string;
      /** Format package-level rows only for console output. */
      packages(result: Result): string;
    };

    /** Required diagnostic detail and deterministic terminal seams for a final handoff. */
    export type HandoffOptions = {
      /** Minimal repair items or full failed-package diagnostic evidence and streams. */
      detail: 'compact' | 'full';
      /** Final screen receipt used by compact handoffs to omit repair items visible above. */
      screen?: Test.Reporter.ScreenCompletion;
      /** Terminal-output override used for width and path presentation. */
      terminal?: boolean;
      /** Explicit output width. Defaults to terminal width or a deterministic fallback. */
      width?: number;
    };

    /** Width options for aligned runner intro lines. */
    export type IntroLineOptions = {
      /** Explicit output width. Defaults to the terminal width when available. */
      width?: number;
      /** Whether terminal width should be measured from stdout. */
      terminal?: boolean;
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
    write?: (text: string) => void;
    /** Timer dependencies for tests and runtime adaptation. */
    deps?: Deps;
  };

  /** Input for formatting a post-completion hang warning. */
  export type FormatInput = {
    /** Completed workspace run result. */
    result: WorkspaceRun.Result;
    /** Run strategy context when known by the process-owning caller. */
    strategy?: StrategyContext;
    /** Delay before the warning is emitted. */
    delay?: t.Msecs;
    /** Maximum number of package rows to include. */
    contextLimit?: number;
  };

  /** Strategy context rendered in the warning. */
  export type StrategyContext = WorkspaceRun.Test.Strategy | {
    kind: 'parallel';
    jobs: number;
  };

  /** Armed warning handle. */
  export type Armed = {
    /** Cancel the pending warning. */
    readonly cancel: () => void;
  };

  /** Timer dependencies used by the warning arm. */
  export type Deps = {
    /** Schedule the one-shot warning callback. */
    setTimeout: (fn: () => void, delay: number) => number;
    /** Clear a scheduled warning callback. */
    clearTimeout: (id: number) => void;
    /** Release the timer from process-liveness retention. */
    unrefTimer: (id: number) => void;
  };
}
