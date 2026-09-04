import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.github.ts';
export type * from './t.namespace.ts';

/**
 * Pull CLI entry contract.
 */
export type PullToolsLib = {
  /** Run Pull with interactive menus or explicit non-interactive arguments. */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
