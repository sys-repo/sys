import type { t } from './common.ts';

/**
 * Host and child-process contracts for `Process`.
 */
export declare namespace Process {
  /**
   * Host and child process capabilities.
   * https://docs.deno.com/api/deno/~/Deno.Command
   */
  export type Lib = {
    /** Script helpers for preparing shell template strings. */
    readonly Script: ScriptLib;

    /** Shared process signals. */
    readonly Signal: {
      /** Standard token a child process can print to stdout to mark "ready". */
      readonly ready: 'PROCESS_READY';
    };

    /** Canonical host-process stdout capability. */
    readonly stdout: Stdout;

    /** Determine whether an OS process currently accepts signal delivery. */
    isRunning(pid: number): boolean;

    /** Local port inspection helpers. */
    readonly Port: Port.Lib;

    /** Process termination helpers. */
    readonly Terminate: Terminate.Lib;

    /**
     * Execute a <unix> command on a child process
     * and wait for response.
     */
    invoke(config: t.Process.InvokeArgs): Promise<t.Process.Output>;

    /** Execute a no-shell argv command with bounded stdout/stderr capture. */
    capture(config: t.Process.CaptureArgs): Promise<t.Process.CaptureOutput>;

    /**
     * Execute a command with child stdio inherited from the parent terminal.
     * Useful for interactive tools/prompts.
     *
     * NB: `silent` has no effect for this method.
     */
    inherit(config: t.Process.InvokeArgs): Promise<t.Process.InheritOutput>;

    /**
     * Execute a command in a fire-and-forget manner,
     * detaching stdio and unref'ing the child so the host
     * process is free to exit immediately.
     */
    invokeDetached(config: t.Process.InvokeArgs): { pid: number };

    /**
     * Spawn a child process to run a <unix>-like command
     * and retrieve a streaming handle to monitor and control it.
     */
    spawn(config: t.Process.SpawnArgs): t.Process.Handle;

    /**
     * Run an <shell> command.
     */
    sh(options?: t.Process.ShellOptions): t.Process.Shell;
    sh(path: t.StringPath): t.Process.Shell;

    /**
     * Runs a multiline shell script with sane defaults
     * for strictness and output control.
     */
    run(script: string, opts?: t.Process.ShellOptions): Promise<t.Process.Output>;
  };

  /** Canonical host-process stdout capability. */
  export type Stdout = {
    /** Determine whether stdout is attached to a terminal. */
    isTerminal(): boolean;
    /** Write complete UTF-8 text synchronously to stdout. */
    write(text: string): void;
  };

  /** Script helpers for preparing shell template strings. */
  export type ScriptLib = {
    /** Dedent a template literal. Matches repo-wide `Str.dedent`. */
    t(strings: TemplateStringsArray, ...values: unknown[]): string;

    /** Dedent and trim all outer blank lines. */
    tight(strings: TemplateStringsArray, ...values: unknown[]): string;
  };

  /**
   * Local port inspection contracts.
   */
  export namespace Port {
    /** Local port inspection helper API. */
    export type Lib = {
      /** Discover TCP LISTEN sockets matching a local port target. */
      listeners(input: Input): Promise<readonly Listener[]>;
    };

    /** Supported listener protocol for local port inspection. */
    export type Protocol = 'tcp';

    /** Port target shorthand or structured target. */
    export type Input = number | TargetInput;

    /** Structured local port target. */
    export type TargetInput = {
      readonly port: number;
      readonly host?: string;
      readonly protocol?: Protocol;
    };

    /** Normalized local port target. */
    export type Target = {
      readonly port: number;
      readonly protocol: Protocol;
      readonly host?: string;
    };

    /** TCP listener discovered for a local port target. */
    export type Listener = {
      readonly pid: number;
      readonly protocol: Protocol;
      readonly port: number;
      readonly name: string;
      readonly host?: string;
      readonly command?: string;
    };
  }

  /**
   * Process termination contracts.
   */
  export namespace Terminate {
    /** Process termination helper API. */
    export type Lib = {
      /** Terminate an arbitrary process id with bounded graceful escalation. */
      pid(pid: number, options?: Options): Promise<Result>;

      /** Terminate TCP listener process ids bound to a local port target. */
      port(input: Process.Port.Input, options?: Options): Promise<Port.Result>;
    };

    /** Result status for arbitrary process id termination. */
    export type Status = 'not-running' | 'terminated' | 'killed' | 'still-running';

    /** Signal attempt emitted while terminating an arbitrary process id. */
    export type Action = {
      readonly signal: Deno.Signal;
      readonly ok: boolean;
      readonly error?: unknown;
    };

    /** Options for arbitrary process id termination. */
    export type Options = {
      /** Grace window after SIGTERM before SIGKILL escalation. Defaults to 1000ms. */
      readonly timeout?: t.Msecs;
      /** Send SIGKILL immediately instead of attempting SIGTERM first. */
      readonly force?: boolean;
    };

    /** Result from arbitrary process id termination. */
    export type Result = {
      readonly pid: number;
      readonly status: Status;
      readonly actions: readonly Action[];
    };

    /**
     * Port listener termination contracts.
     */
    export namespace Port {
      /** Aggregate status for port listener cleanup. */
      export type Status =
        | 'not-listening'
        | 'terminated'
        | 'killed'
        | 'partial'
        | 'still-running';

      /** Result from terminating listener process ids for a local port target. */
      export type Result = {
        readonly target: Process.Port.Target;
        readonly status: Status;
        readonly listeners: readonly Process.Port.Listener[];
        readonly results: readonly Terminate.Result[];
      };
    }
  }

  /** Ways to handle `stdin` on a spawned child process. */
  export type Stdio = 'piped' | 'inherit' | 'null';

  /** Direction of a STDIO stream. */
  export type StdStream = 'stdout' | 'stderr';

  /** Arguments passed to the `Process.invoke` method. */
  export type InvokeArgs = {
    args: string[];
    cmd?: string;
    cwd?: string;
    env?: t.Process.Env;
    silent?: boolean;
  };

  /** Arguments passed to `Process.capture`. */
  export type CaptureArgs = {
    args: string[];
    cmd?: string;
    cwd?: string;
    env?: t.Process.Env;
    signal?: AbortSignal;
    timeoutMs?: t.Msecs;
    maxStdoutBytes: number;
    maxStderrBytes: number;
    killGraceMs?: t.Msecs;
  };

  /** Terminal output variants returned by `Process.capture`. */
  export type CaptureOutput =
    | CaptureExitedOutput
    | CaptureTimedOutOutput
    | CaptureCancelledOutput
    | CaptureFailedToStartOutput;

  /** Shared bounded capture output fields. */
  export type CaptureBaseOutput = {
    readonly stdout: Uint8Array;
    readonly stderr: Uint8Array;
    readonly text: { readonly stdout: string; readonly stderr: string };
    readonly stdoutTruncated: boolean;
    readonly stderrTruncated: boolean;
    toString(): string;
  };

  /** Termination metadata for naturally exited capture results. */
  export type CaptureNoTermination = {
    readonly reason: null;
    readonly actions: readonly t.Process.Terminate.Action[];
  };

  /** Termination metadata for timeout/cancellation capture results. */
  export type CaptureTermination<R extends 'timeout' | 'cancelled'> = {
    readonly reason: R;
    readonly actions: readonly t.Process.Terminate.Action[];
  };

  /** Capture result for a child process that exited before timeout/cancellation. */
  export type CaptureExitedOutput = CaptureBaseOutput & {
    readonly outcome: 'exited';
    readonly status: Deno.CommandStatus;
    readonly code: number;
    readonly success: boolean;
    readonly signal: Deno.Signal | null;
    readonly termination: CaptureNoTermination;
  };

  /** Capture result for a child process stopped by timeout. */
  export type CaptureTimedOutOutput = CaptureBaseOutput & {
    readonly outcome: 'timed-out';
    readonly status: Deno.CommandStatus | null;
    readonly code: number | null;
    readonly success: false;
    readonly signal: Deno.Signal | null;
    readonly termination: CaptureTermination<'timeout'>;
  };

  /** Capture result for a child process stopped by cancellation. */
  export type CaptureCancelledOutput = CaptureBaseOutput & {
    readonly outcome: 'cancelled';
    readonly status: Deno.CommandStatus | null;
    readonly code: number | null;
    readonly success: false;
    readonly signal: Deno.Signal | null;
    readonly termination: CaptureTermination<'cancelled'>;
  };

  /** Capture result for command construction/spawn substrate failures. */
  export type CaptureFailedToStartOutput = CaptureBaseOutput & {
    readonly outcome: 'failed-to-start';
    readonly status: null;
    readonly code: null;
    readonly success: false;
    readonly signal: null;
    readonly termination: CaptureNoTermination;
    readonly error: unknown;
  };

  /** Arguments passed to the `Process.spawn` method. */
  export type SpawnArgs = t.Process.InvokeArgs & {
    until?: t.UntilInput;

    /**
     * The flag used in the child process to signal "ready" and cause
     * the `whenReady` promise to resolve. When omitted readiness is
     * signalled immediately on first StdOut.
     *
     * This is useful, for example, when a child-process is starting up an HTTP server,
     * and you need a reliable way to signal back to the host when it is ready
     * to recieve inbound requests.
     *
     * @example
     * When using `readySignal` emit the signal to the console within
     * the spawned child process:
     *
     * ```ts
     * const readySignal = 'PROCESS_READY';
     * const cmd = `console.log("${readySignal}");`;
     * const handle = Process.spawn({ args: ['eval', cmd], readySignal });
     *
     * await handle.whenReady();
     * ```
     */
    readySignal?: string | t.Process.ReadySignalFilter;
  };

  /** A function that determines if a process/stdio event is a "ready" signal. */
  export type ReadySignalFilter = (e: t.Process.Event) => boolean;

  /**
   * The output from the `Process.spawn` command that represents
   * a running child-process.
   */
  export type Handle = t.LifecycleAsync & globalThis.AsyncDisposable & {
    /** Child process ID. */
    readonly pid: number;
    /** Stream of stdout/stderr events emitted by the child. */
    readonly $: t.Observable<t.Process.Event>;
    /** Runtime readiness flags. */
    readonly is: { readonly ready: boolean };
    /** Resolves on readiness; rejects if the child exits/disposes before readiness. */
    whenReady(fn?: ReadyHandler): Promise<t.Process.Handle>;
    /** Register a stdout event handler. */
    onStdOut(fn: t.Process.EventHandler): t.Process.Handle;
    /** Register a stderr event handler. */
    onStdErr(fn: t.Process.EventHandler): t.Process.Handle;
  };

  /** Handler for the `Process.whenReady` method. */
  export type ReadyHandler = (e: ReadyHandlerArgs) => void;

  /** Arguments passed to the `Process.whenReady` method. */
  export type ReadyHandlerArgs = {
    readonly pid: number;
    readonly cmd: string;
    toString(): string;
  };

  /** A shell command ("sh"). */
  export type Shell = {
    readonly path: string;
    run(...args: string[]): Promise<t.Process.Output>;
  };

  /** Options passed to the `Process.sh` method. */
  export type ShellOptions = {
    readonly args?: string[];
    readonly silent?: boolean;
    readonly path?: string;

    /**
     * strict (default: true)
     * - When true, prepends `set -e` to the shell script so the shell exits on the
     *   first failing command. This does NOT treat non-empty stderr as failure.
     * - When false, `set -e` is not added.
     */
    readonly strict?: boolean;
  };

  /** Command output with lazy decoded text. */
  export type Output = {
    readonly code: number;
    readonly success: boolean;
    readonly signal: Deno.Signal | null;
    readonly stdout: Uint8Array;
    readonly stderr: Uint8Array;
    readonly text: { readonly stdout: string; readonly stderr: string };
    toString(): string;
  };

  /**
   * Exit status from an inherited-stdio process.
   * NB: stdout/stderr are not captured when stdio is inherited.
   */
  export type InheritOutput = {
    readonly code: number;
    readonly success: boolean;
    readonly signal: Deno.Signal | null;
  };

  /** Handles events on a process. */
  export type EventHandler = (e: t.Process.Event) => void;

  /** Event fired when data is emitted by the process. */
  export type Event = {
    readonly source: t.Process.StdStream;
    readonly data: Uint8Array;
    toString(): string;
  };

  /**
   * Environment values passed through to a child process.
   *
   * This remains an open string map, but a small number of keys have
   * repo-level semantics and are documented here to prevent drift.
   */
  export type Env = Record<string, string> & {
    /**
     * Pseudo-standard tooling convention for the initiating terminal cwd.
     *
     * Not a Unix/POSIX env var.
     * Consumed by `Fs.cwd('terminal')` to preserve the caller's original
     * terminal directory across delegated child-process launches.
     */
    INIT_CWD?: t.StringDir;
  };
}
