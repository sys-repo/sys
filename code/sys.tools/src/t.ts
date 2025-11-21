import type { t } from './common.ts';

/**
 * The shared/command command line arguments (argv).
 */
export type ToolsCliArgs = { help: boolean };

/**
 * Common result response from tool runs.
 */
export type RunResult = {
  exit: number | boolean;
};
