import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.namespace.ts';
export type * from './cmd.pull/t.ts';

/**
 * CLI helpers for working with Pull.
 */
export type PullToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
