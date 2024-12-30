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
  invoke(config: t.CmdInvokeArgs): Promise<t.CmdOutput>;

  /**
   * Spawn a child process to run a <unix>-like command
   * and retrieve a streaming handle to monitor and control it.
   */
  spawn(config: t.CmdSpawnArgs): t.CmdProcessHandle;

  /**
   * Run an <shell> command.
   */
  sh(options?: t.ShellCmdOptions): t.ShellCmd;
  sh(path: t.StringPath): t.ShellCmd;
};

/** Arguments passed to the `Process.invoke` method. */
export type CmdInvokeArgs = {
  args: string[];
  cmd?: string;
  cwd?: string;
  env?: Record<string, string>;
  silent?: boolean;
};

/** Arguments passed to the `Process.spawn` method. */
export type CmdSpawnArgs = t.CmdInvokeArgs & {
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
  readySignal?: string | t.CmdReadySignalFilter;
};

/** A function that determines if the given process/stdio event represents a "ready" signal. */
export type CmdReadySignalFilter = (e: t.CmdProcessEvent) => boolean;

/**
 * The output from the `Process.spawn` command that represents
 * a running child-process.
 */
export type CmdProcessHandle = t.LifecycleAsync & {
  readonly pid: number;
  readonly $: t.Observable<t.CmdProcessEvent>;
  readonly is: { readonly ready: boolean };
  whenReady(fn?: CmdProcessReadyHandler): Promise<t.CmdProcessHandle>;
  onStdOut(fn: t.CmdProcessEventHandler): t.CmdProcessHandle;
  onStdErr(fn: t.CmdProcessEventHandler): t.CmdProcessHandle;
};

export type CmdProcessReadyHandler = (e: CmdProcessReadyHandlerArgs) => void;
export type CmdProcessReadyHandlerArgs = {
  readonly pid: number;
  readonly cmd: string;
  toString(): string;
};

/**
 * A shell command ("sh").
 */
export type ShellCmd = {
  readonly path: string;
  run(...args: string[]): Promise<t.CmdOutput>;
};

/** Options passed to the `Process.sh` method.  */
export type ShellCmdOptions = {
  readonly args?: string[];
  readonly silent?: boolean;
  readonly path?: string;
};

/**
 * Command Output as strings
 */
export type CmdOutput = {
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
export type CmdProcessEventHandler = (e: t.CmdProcessEvent) => void;
export type CmdProcessEvent = {
  readonly source: t.StdStream;
  readonly data: Uint8Array;
  toString(): string;
};
