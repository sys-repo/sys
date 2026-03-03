import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.namespace.ts';

/**
 * CLI helpers for working with Tmpl.
 */
export type TmplToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
