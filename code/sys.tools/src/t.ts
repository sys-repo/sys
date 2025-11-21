import type { t } from './common.ts';

/**
 * The shared/command command line arguments (argv).
 */
export type ToolsCliArgs = { help: boolean };

/**
 * Common result response from tool runs.
 */
export type RunReturn = {
  /** Process exit code to invoke. True = exit(0); */
  exit: number | boolean;
};
