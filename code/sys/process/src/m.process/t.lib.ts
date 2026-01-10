import type { t } from './common.ts';

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
   * Execute a command in a fire-and-forget manner,
   * detaching stdio and unref'ing the child so the host
   * process is free to exit immediately.
   */
  invokeDetached(config: t.ProcInvokeArgs): { pid: number };

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
