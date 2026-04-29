import type { t } from './common.ts';

export declare namespace Process {
  /**
   * Unix child process.
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

    /**
     * Execute a <unix> command on a child process
     * and wait for response.
     */
    invoke(config: t.Process.InvokeArgs): Promise<t.Process.Output>;

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

  /**
   * Script helpers for preparing shell template strings.
   */
  export type ScriptLib = {
    /**
     * Dedent a template literal (standard behavior).
     * Matches repo-wide `Str.dedent`.
     */
    t(strings: TemplateStringsArray, ...values: unknown[]): string;

    /**
     * Dedent and tightly trim (remove all outer blank lines).
     * Ideal for clean `sh -c` scripts.
     */
    tight(strings: TemplateStringsArray, ...values: unknown[]): string;
  };

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

  /** A function that determines if the given process/stdio event represents a "ready" signal. */
  export type ReadySignalFilter = (e: t.Process.Event) => boolean;

  /**
   * The output from the `Process.spawn` command that represents
   * a running child-process.
   */
  export type Handle = t.LifecycleAsync & {
    readonly pid: number;
    readonly $: t.Observable<t.Process.Event>;
    readonly is: { readonly ready: boolean };
    whenReady(fn?: ReadyHandler): Promise<t.Process.Handle>;
    onStdOut(fn: t.Process.EventHandler): t.Process.Handle;
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

  /**
   * A shell command ("sh").
   */
  export type Shell = {
    readonly path: string;
    run(...args: string[]): Promise<t.Process.Output>;
  };

  /** Options passed to the `Process.sh` method.  */
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

  /**
   * Command Output as strings
   */
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

  /** Handles events on a Process. */
  export type EventHandler = (e: t.Process.Event) => void;

  /** An event fired when data is emmited by the Process. */
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
