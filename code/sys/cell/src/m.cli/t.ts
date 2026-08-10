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
    /** Preview mutating operations without applying them. */
    readonly dryRun: boolean;
    /** Include command-specific agent guidance with help. */
    readonly agent: boolean;
    /** Preview a finite task closure without importing or running endpoints. */
    readonly plan: boolean;
    /** Use hard process termination for trusted kill targets. */
    readonly force: boolean;
    /** Raw `--format` flag value, accepted only by `dsl`. */
    readonly format?: string | boolean | readonly (string | boolean)[];
    /** Raw `--mode` flag value, accepted by `start` and `kill`. */
    readonly mode?: string | boolean | readonly (string | boolean)[];
    /** Raw `--reporter` flag value, accepted only by `start`. */
    readonly reporter?: string | boolean | readonly (string | boolean)[];
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
  export type Result =
    | Help
    | Info.Result
    | Init.Result
    | Migrate.Result
    | Task.Result
    | Start.Result
    | Kill.Result
    | Error;

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
   * Types for the `info` command.
   */
  export namespace Info {
    /** Read-only Cell declaration report result. */
    export type Result = {
      /** Result discriminant. */
      readonly kind: 'info';
      /** Raw input passed to the CLI entrypoint. */
      readonly input: Input;
      /** Rendered info output. */
      readonly text: string;
      /** Loaded Cell root. */
      readonly root: string;
      /** Descriptor path displayed relative to the Cell root. */
      readonly descriptor: string;
      /** Descriptor schema version. */
      readonly version: t.Cell.Descriptor['version'];
      /** Optional stable identity declared by the Cell. */
      readonly name?: t.Cell.Descriptor['name'];
      /** Count of declared services. */
      readonly services: number;
      /** Count of declared tasks. */
      readonly tasks: number;
      /** Cell descriptor facts rendered by the info command. */
      readonly report: Report;
    };

    /** Cell descriptor facts rendered by the info command. */
    export type Report = {
      /** Loaded Cell root. */
      readonly root: string;
      /** Descriptor path displayed relative to the Cell root. */
      readonly descriptor: string;
      /** Descriptor path loaded by Cell. */
      readonly descriptorPath: string;
      /** Descriptor schema version. */
      readonly version: t.Cell.Descriptor['version'];
      /** Optional stable identity declared by the Cell. */
      readonly name?: t.Cell.Descriptor['name'];
      /** Services declared by the Cell descriptor. */
      readonly services: readonly t.Cell.Services.Service[];
      /** Tasks declared by the Cell descriptor. */
      readonly tasks: readonly t.Cell.Task.Descriptor[];
    };
  }

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
    /**
     * Terminal ownership policy for the start command.
     *
     * `auto` chooses `screen` only when stdin and stdout are interactive. Explicit `screen`
     * requires that capability; `raw` remains append-only.
     */
    export type ReporterMode = 'auto' | 'screen' | 'raw';

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

  /**
   * Types for the `kill` command.
   */
  export namespace Kill {
    /** Successful Cell kill-switch result. */
    export type Result = {
      /** Result discriminant. */
      readonly kind: 'kill';
      /** Raw input passed to the CLI entrypoint. */
      readonly input: Input;
      /** Rendered kill output. */
      readonly text: string;
      /** Suggested process exit code. */
      readonly code: number;
      /** Loaded or discovered Cell root. */
      readonly root: string;
      /** Selected service graph mode when `--mode` was supplied. */
      readonly mode?: t.Cell.Services.ServiceMode;
      /** True when no process or registry mutation was performed. */
      readonly dryRun: boolean;
      /** True when trusted live sessions used hard termination. */
      readonly force: boolean;
      /** Per-session kill audit. */
      readonly sessions: readonly SessionResult[];
      /** Per-resource listener cleanup audit. */
      readonly resources: readonly ResourceResult[];
    };

    /** Result status for one matching runtime session. */
    export type SessionStatus =
      | 'would-terminate'
      | 'would-remove-stale'
      | 'not-running'
      | 'terminated'
      | 'killed'
      | 'still-running'
      | 'stale-running';

    /** Result status for one declared runtime resource. */
    export type ResourceStatus =
      | 'would-terminate'
      | 'not-listening'
      | 'terminated'
      | 'killed'
      | 'partial'
      | 'still-running'
      | 'skipped';

    /** Listener process discovered for one declared runtime resource. */
    export type ResourceListener = {
      /** Listener process id. */
      readonly pid: number;
      /** Optional command name reported by the operating system. */
      readonly command?: string;
    };

    /** Kill audit for one declared runtime resource. */
    export type ResourceResult = {
      /** Service that declared the resource. */
      readonly service: string;
      /** Runtime resource kind. */
      readonly kind: t.Service.Resource.Any['kind'];
      /** Optional listen host declared by the owner. */
      readonly host?: string;
      /** Listen port declared by the owner. */
      readonly port: t.PortNumber;
      /** Per-resource cleanup status. */
      readonly status: ResourceStatus;
      /** Discovered listener process ids. */
      readonly listeners: readonly ResourceListener[];
      /** Reason a resource was not observed or reaped. */
      readonly reason?: string;
    };

    /** Kill audit for one matching runtime session. */
    export type SessionResult = {
      /** Runtime session id. */
      readonly id: string;
      /** Runtime session mode. */
      readonly mode: t.Cell.Services.ServiceMode;
      /** Runtime session supervisor pid. */
      readonly pid: number;
      /** Last recorded runtime session state. */
      readonly state: 'starting' | 'ready' | 'stopping';
      /** Per-session kill status. */
      readonly status: SessionStatus;
      /** True when the heartbeat was fresh enough to trust the pid identity. */
      readonly fresh: boolean;
      /** Last heartbeat timestamp. */
      readonly updatedAt: t.UnixTimestamp;
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
