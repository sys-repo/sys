import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.namespace.ts';

/**
 * CLI helpers for shell profile diagnostics.
 */
export type ShellToolsLib = {
  /** Run the shell CLI flow. */
  cli(
    cwd?: t.StringDir,
    argv?: string[],
    context?: t.ShellTool.CliContext,
  ): Promise<t.ShellTool.CliResult>;

  /** Run the read-only shell doctor. */
  doctor(): Promise<t.ShellTool.Doctor.Report>;
};
