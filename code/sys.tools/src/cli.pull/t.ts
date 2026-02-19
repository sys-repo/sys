import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.namespace.ts';
export type * from './u.bundle/t.ts';
export type * from './u.github/t.ts';

/**
 * CLI helpers for working with Pull.
 */
export type PullToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
