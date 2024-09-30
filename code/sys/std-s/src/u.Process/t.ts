import type { t } from './common.ts';

export type Stdio = 'piped' | 'inherit' | 'null';
export type StdStream = 'stdout' | 'stderr';

/**
 * Unix child process.
 * https://docs.deno.com/api/deno/~/Deno.Command
 */
export type Cmd = {
  /**
   * Execute a <unix> command on a child process
   * and wait for response.
   */
  invoke(args: t.CmdInvokeArgs): Promise<t.CmdOutput>;

  /**
   * Spawn a child process to run a <unix> command
   * and retrieve a streaming handle to monitor and control it.
   */
  spawn(args: t.CmdSpawnArgs): t.CmdProcessHandle;

  /**
   * Run an <shell> command.
   */
  sh(options?: t.ShellCmdOptions): t.ShellCmd;
  sh(path: t.StringPath): t.ShellCmd;
};

/**
 * Process: Invoke
 */
export type CmdInvokeArgs = {
  args: string[];
  cmd?: string;
  cwd?: string;
  env?: Record<string, string>;
  silent?: boolean;
};

/**
 * Process: Spawn
 */
export type CmdSpawnArgs = t.CmdInvokeArgs & { dispose$?: t.UntilObservable };

/**
 * The output from the Run command that represents
 * a spawned child-process.
 */
export type CmdProcessHandle = t.LifecycleAsync & {
  readonly pid: number;
  readonly $: t.Observable<t.CmdProcessEvent>;
  readonly is: { readonly ready: boolean };
  whenReady(): Promise<void>;
  onStdio(fn: t.CmdProcessEventHandler): t.CmdProcessHandle;
};

/**
 * A shell command ("sh").
 */
export type ShellCmd = {
  readonly path: string;
  run(...args: string[]): Promise<t.CmdOutput>;
};

export type ShellCmdOptions = { args?: string[]; silent?: boolean; path?: string };

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
  readonly kind: t.StdStream;
  readonly data: Uint8Array;
  toString(): string;
};
