import type { t } from './common.ts';

/**
 * Cell operator CLI.
 */
export declare namespace CellCli {
  /** Library surface for Cell CLI flows. */
  export type Lib = {
    /** Run the Cell CLI from raw argv input. */
    run(input?: Input): Promise<Result>;
  };

  /** Raw CLI entrypoint input. */
  export type Input = {
    /** Raw argv tokens passed to the CLI entrypoint. */
    readonly argv?: readonly string[];
  };

  /** Typed argv shape produced by `Args.parse(...)` for the Cell CLI. */
  export type ParsedArgs = {
    /** Show CLI help and exit. */
    readonly help: boolean;
    /** Preview writes without changing the filesystem. */
    readonly dryRun: boolean;
    /** Include command-specific agent guidance with help. */
    readonly agent: boolean;
    /** Preview a finite task closure without importing or running endpoints. */
    readonly plan: boolean;
    /** Raw `--format` flag value, accepted only by `dsl`. */
    readonly format?: string | boolean | readonly (string | boolean)[];
    /** Raw `--mode` flag value, accepted only by `start`. */
    readonly mode?: string | boolean | readonly (string | boolean)[];
    /** Unknown flag tokens rejected by argument parsing. */
    readonly unknown: readonly string[];
    /** Positional argv tokens. */
    readonly _: readonly string[];
  };

  /**
   * Types for the `dsl` command.
   */
  export namespace Dsl {
    /** Supported DSL chapter output formats. */
    export type Format = 'human' | 'skill';
  }

  /** Result from a Cell CLI run. */
  export type Result = Help | Init.Result | Migrate.Result | Task.Result | Start.Result | Error;

  /** Help-only CLI run result. */
  export type Help = {
    /** Result discriminant. */
    readonly kind: 'help';
    /** Raw input passed to the CLI entrypoint. */
    readonly input: Input;
    /** Rendered help output. */
    readonly text: string;
  };

  /**
   * Types for the `init` command.
   */
  export namespace Init {
    /** Successful Cell init result. */
    export type Result = {
      /** Result discriminant. */
      readonly kind: 'init';
      /** Raw input passed to the CLI entrypoint. */
      readonly input: Input;
      /** Rendered init output. */
      readonly text: string;
      /** Target folder. */
      readonly target: string;
      /** True when no files were written. */
      readonly dryRun: boolean;
      /** Template write operations. */
      readonly ops: readonly Op[];
    };

    /** Init write operation. */
    export type Op = {
      /** Operation kind. */
      readonly kind: 'create' | 'modify' | 'skip';
      /** Relative path. */
      readonly path: string;
      /** Optional skip reason. */
      readonly reason?: string;
      /** True when operation was previewed only. */
      readonly dryRun?: boolean;
    };
  }

  /**
   * Types for the `migrate` command.
   */
  export namespace Migrate {
    /** Successful Cell migration result. */
    export type Result = {
      /** Result discriminant. */
      readonly kind: 'migrate';
      /** Raw input passed to the CLI entrypoint. */
      readonly input: Input;
      /** Rendered migrate output. */
      readonly text: string;
      /** Target folder. */
      readonly target: string;
      /** True when no files were moved. */
      readonly dryRun: boolean;
      /** Planned migration operations. */
      readonly planned: readonly Op[];
      /** Applied migration operations. */
      readonly migrated: readonly Op[];
      /** Skipped migration operations. */
      readonly skipped: readonly Op[];
    };

    /** Migrate operation. */
    export type Op = {
      /** Source relative path. */
      readonly from: string;
      /** Destination relative path. */
      readonly to: string;
      /** Optional reason for skipped operations. */
      readonly reason?: string;
    };
  }

  /**
   * Types for the `task` command.
   */
  export namespace Task {
    /** Successful finite Cell task result. */
    export type Result = RunResult | PlanResult;

    /** Successful finite Cell task execution result. */
    export type RunResult = {
      /** Result discriminant. */
      readonly kind: 'task';
      /** Raw input passed to the CLI entrypoint. */
      readonly input: Input;
      /** Rendered task output. */
      readonly text: string;
      /** Loaded Cell root. */
      readonly root: string;
      /** Root task name that was run. */
      readonly task: string;
      /** Number of leaf steps executed. */
      readonly steps: number;
    };

    /** Successful finite Cell task plan result. */
    export type PlanResult = {
      /** Result discriminant. */
      readonly kind: 'task-plan';
      /** Raw input passed to the CLI entrypoint. */
      readonly input: Input;
      /** Rendered task plan output. */
      readonly text: string;
      /** Loaded Cell root. */
      readonly root: string;
      /** Root task name that was planned. */
      readonly task: string;
      /** Number of planned leaf steps. */
      readonly steps: number;
    };
  }

  /**
   * Types for the `start` command.
   */
  export namespace Start {
    /** Successful Cell services start result. */
    export type Result = {
      /** Result discriminant. */
      readonly kind: 'start';
      /** Raw input passed to the CLI entrypoint. */
      readonly input: Input;
      /** Rendered start output. */
      readonly text: string;
      /** Loaded Cell root. */
      readonly root: string;
      /** Number of services started. */
      readonly services: number;
      /** Non-default service graph mode selected for this start. */
      readonly mode?: t.Cell.Services.ServiceMode;
    };
  }

  /** Unsupported invocation result. */
  export type Error = {
    /** Result discriminant. */
    readonly kind: 'error';
    /** Raw input passed to the CLI entrypoint. */
    readonly input: Input;
    /** Rendered help output. */
    readonly text: string;
    /** Suggested process exit code. */
    readonly code: number;
  };
}
