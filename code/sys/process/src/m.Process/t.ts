import type { t } from './common.ts';

/** Ways to handle `stdin` on a spawned child process. */
export type Stdio = 'piped' | 'inherit' | 'null';

/** Direction of a STDIO stream. */
export type StdStream = 'stdout' | 'stderr';

/**
 * Unix child process.
 * https://docs.deno.com/api/deno/~/Deno.Command
 */
export type ProcLib = {
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
  invoke(config: t.ProcInvokeArgs): Promise<t.ProcOutput>;

  /**
   * Spawn a child process to run a <unix>-like command
   * and retrieve a streaming handle to monitor and control it.
   */
  spawn(config: t.ProcSpawnArgs): t.ProcHandle;

  /**
   * Run an <shell> command.
   */
  sh(options?: t.ShellProcOptions): t.ShellProc;
  sh(path: t.StringPath): t.ShellProc;

  /**
   * Runs a multiline shell script with sane defaults
   * for strictness and output control.
   */
  run(script: string, opts?: t.ShellProcOptions): Promise<t.ProcOutput>;
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

/** Arguments passed to the `Process.invoke` method. */
export type ProcInvokeArgs = {
  args: string[];
  cmd?: string;
  cwd?: string;
  env?: Record<string, string>;
  silent?: boolean;
};

/** Arguments passed to the `Process.spawn` method. */
export type ProcSpawnArgs = t.ProcInvokeArgs & {
  dispose$?: t.UntilObservable;

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
  readySignal?: string | t.ProcReadySignalFilter;
};

/** A function that determines if the given process/stdio event represents a "ready" signal. */
export type ProcReadySignalFilter = (e: t.ProcEvent) => boolean;

/**
 * The output from the `Process.spawn` command that represents
 * a running child-process.
 */
export type ProcHandle = t.LifecycleAsync & {
  readonly pid: number;
  readonly $: t.Observable<t.ProcEvent>;
  readonly is: { readonly ready: boolean };
  whenReady(fn?: ProcReadyHandler): Promise<t.ProcHandle>;
  onStdOut(fn: t.ProcEventHandler): t.ProcHandle;
  onStdErr(fn: t.ProcEventHandler): t.ProcHandle;
};

/** Handler for the `Process.whenReady` method. */
export type ProcReadyHandler = (e: ProcProcessReadyHandlerArgs) => void;

/** Arguments passed to the `Process.whenReady` method. */
export type ProcProcessReadyHandlerArgs = {
  readonly pid: number;
  readonly cmd: string;
  toString(): string;
};

/**
 * A shell command ("sh").
 */
export type ShellProc = {
  readonly path: string;
  run(...args: string[]): Promise<t.ProcOutput>;
};

/** Options passed to the `Process.sh` method.  */
export type ShellProcOptions = {
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
export type ProcOutput = {
  readonly code: number;
  readonly success: boolean;
  readonly signal: Deno.Signal | null;
  readonly stdout: Uint8Array;
  readonly stderr: Uint8Array;
  readonly text: { readonly stdout: string; readonly stderr: string };
  toString(): string;
};

/** Handles events on a Process. */
export type ProcEventHandler = (e: t.ProcEvent) => void;

/** An event fired when data is emmited by the Process. */
export type ProcEvent = {
  readonly source: t.StdStream;
  readonly data: Uint8Array;
  toString(): string;
};
