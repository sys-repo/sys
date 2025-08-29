import type { t } from './common.ts';

/**
 * Standard system template library.
 */
export type StdTmplLib = {
  /** Run in CLI mode. */
  cli(args?: { dryRun?: boolean; argv?: string[] }): Promise<void>;
};
