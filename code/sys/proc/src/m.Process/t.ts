import type { t } from './common.ts';

export type Stdio = 'piped' | 'inherit' | 'null';
export type StdStream = 'stdout' | 'stderr';

/**
 * Unix child process.
 * https://docs.deno.com/api/deno/~/Deno.Command
 */
export type Proc = {
  readonly Signal: {
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

export type ProcReadyHandler = (e: ProcProcessReadyHandlerArgs) => void;
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

/**
 * Process Events
 */
export type ProcEventHandler = (e: t.ProcEvent) => void;
export type ProcEvent = {
  readonly source: t.StdStream;
  readonly data: Uint8Array;
  toString(): string;
};
