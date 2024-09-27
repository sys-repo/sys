import type { t } from '../common/mod.ts';

/**
 * Unix child process.
 * https://docs.deno.com/api/deno/~/Deno.Command
 */
export type Cmd = {
  /**
   * Run a <unix> command (on spawned child process).
   */
  run(args: string[], options?: t.CmdOptions): Promise<t.CmdOutput>;

  /**
   * Run an <shell> command.
   */
  sh(options?: t.ShellCmdOptions): t.ShellCmd;
  sh(path: string): t.ShellCmd;

  /**
   * Decode a command output to strings.
   */
  decode(input: Deno.CommandOutput): t.CmdOutput;
};

/**
 * A shell command ("sh").
 */
export type ShellCmd = {
  readonly path: string;
  run(...args: string[]): Promise<t.CmdOutput>;
};

export type ShellCmdOptions = { args?: string[]; silent?: boolean; path?: string };
export type CmdOptions = { cmd?: string; cwd?: string; silent?: boolean };

/**
 * Command Output as strings
 */
export type CmdOutput = {
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
