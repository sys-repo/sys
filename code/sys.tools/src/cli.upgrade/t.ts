import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.namespace.ts';

/**
 * CLI helpers for upgrading the locally installed
 * `@sys/tools` module itself (self:reflective).
 */
export type UpgradeToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(
    cwd?: t.StringDir,
    argv?: string[],
    context?: t.UpgradeTool.CliContext,
  ): Promise<t.UpgradeTool.CliResult>;
};
