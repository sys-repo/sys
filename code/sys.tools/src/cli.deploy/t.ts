import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.namespace.ts';
export type * from './u.fmt/t.ts';
export type * from './u.providers/t.ts';
export type * from './u.push/t.ts';

/**
 * CLI helpers for working with Deploy.
 */
export type DeployToolsLib = {
  /** Run the deploy CLI flow (interactive by default, strict with `--no-interactive`). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
