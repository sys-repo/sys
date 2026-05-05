import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.namespace.ts';

/**
 * CLI helpers for updating the locally installed
 * `@sys/tools` module itself (self:reflective).
 */
export type UpdateToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(
    cwd?: t.StringDir,
    argv?: string[],
    context?: t.UpdateTool.CliContext,
  ): Promise<t.UpdateTool.CliResult>;
};
