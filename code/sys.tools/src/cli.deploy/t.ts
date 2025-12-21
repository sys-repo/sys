import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.namespace.ts';
export type * from './u.providers/t.noop.ts';
export type * from './u.providers/t.orbiter.ts';

/**
 * CLI helpers for working with Deploy.
 */
export type DeployToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
