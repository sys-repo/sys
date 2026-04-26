import type { t } from './common.ts';

/**
 * Tools for working with the installed Deno runtime version and upgrade status.
 */
export declare namespace DenoVersion {
  /**
   * Library surface for Deno runtime version and upgrade facts.
   */
  export type Lib = {
    /** Installed local Deno runtime version facts. */
    readonly Current: DenoVersion.Current.Lib;
    /** Deno runtime upgrade status and execution helpers. */
    readonly Upgrade: DenoVersion.Upgrade.Lib;
  };

  /**
   * Shared input for interacting with the installed Deno runtime executable.
   */
  export type Input = {
    /** Working directory used for process execution. */
    readonly cwd?: t.StringDir;
    /** Override the executable name/path. Default: `deno`. */
    readonly cmd?: string;
    /** Optional environment overrides for process execution. */
    readonly env?: Record<string, string>;
  };

  /**
   * Captured raw process output.
   *
   * Keep this shape stable and available even when parsing succeeds so
   * downstream callers retain durable forensic material if Deno CLI wording
   * changes later.
   */
  export type Output = {
    readonly cmd: string;
    readonly args: readonly string[];
    readonly code: number;
    readonly success: boolean;
    readonly signal: Deno.Signal | null;
    readonly stdout: Uint8Array;
    readonly stderr: Uint8Array;
    readonly text: {
      readonly stdout: string;
      readonly stderr: string;
    };
    toString(): string;
  };

  /**
   * Standard response shape from DenoVersion operations.
   */
  export type Result<TData> =
    | {
      readonly ok: true;
      readonly data: TData;
      readonly error: undefined;
    }
    | {
      readonly ok: false;
      readonly data: undefined;
      readonly error: t.StdError;
      readonly output?: Output;
    };

  /**
   * Installed local Deno runtime version facts.
   */
  export namespace Current {
    /** Installed local Deno runtime version surface. */
    export type Lib = {
      /** Resolve the currently installed local Deno runtime version. */
      get(input?: DenoVersion.Input): Promise<Result>;
    };

    /** Current local Deno runtime facts. */
    export type Data = {
      readonly version: t.StringSemver;
      readonly output: DenoVersion.Output;
    };

    /** Response from resolving the installed local Deno runtime version. */
    export type Result = DenoVersion.Result<Data>;
  }

  /**
   * Deno runtime upgrade status and execution facts.
   */
  export namespace Upgrade {
    /** Deno runtime upgrade surface. */
    export type Lib = {
      /** Determine whether a Deno runtime upgrade is needed. */
      status(input?: DenoVersion.Input): Promise<StatusResult>;
      /** Execute `deno upgrade` directly. */
      run(input?: Input): Promise<RunResult>;
    };

    /**
     * Explicit version/channel/target passed through to `deno upgrade`.
     * Examples: `stable`, `2.1.3`, `rc`, `<commit-hash>`, `pr 12345`.
     */
    export type Target = string;

    /** Input for executing `deno upgrade`. */
    export type Input = DenoVersion.Input & {
      /** Optional explicit version/channel/target passed to `deno upgrade`. */
      readonly target?: Target;
      /** Perform checks without replacing the current executable. */
      readonly dryRun?: boolean;
      /** Replace the current executable even if it is already current. */
      readonly force?: boolean;
      /** Suppress diagnostic output when supported. */
      readonly quiet?: boolean;
      /** Optional path passed through to `deno upgrade --output`. */
      readonly outputPath?: t.StringPath;
    };

    /** Facts derived from checking whether the installed Deno runtime needs an upgrade. */
    export type Status = {
      /** Installed local Deno runtime version. */
      readonly current: t.StringSemver;
      /** Latest target version, when Deno reported it clearly. */
      readonly latest?: t.StringSemver;
      /** True when Deno indicates a runtime upgrade is needed. */
      readonly needed: boolean;
      /** Source authority used to derive the result. */
      readonly source: 'deno-upgrade-dry-run';
      /** Raw command output retained for diagnostics. */
      readonly output: DenoVersion.Output;
    };

    /** Response from resolving whether a Deno runtime upgrade is needed. */
    export type StatusResult = DenoVersion.Result<Status>;

    /** Facts derived from executing `deno upgrade`. */
    export type Run = {
      /** Installed version before the upgrade attempt, when known. */
      readonly from?: t.StringSemver;
      /** Installed or target version after the upgrade attempt, when known. */
      readonly to?: t.StringSemver;
      /** True when the `deno upgrade` command completed successfully. */
      readonly success: boolean;
      /** Whether the command was executed as a dry run. */
      readonly dryRun: boolean;
      /** Raw command output retained for diagnostics. */
      readonly output: DenoVersion.Output;
    };

    /** Response from executing `deno upgrade`. */
    export type RunResult = DenoVersion.Result<Run>;
  }
}
