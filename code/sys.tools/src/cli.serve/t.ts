import type { t } from './common.ts';

/** Type exports */
export type * from './cmd.pull/t.ts';
export type * from './t.mime.ts';
export type * from './t.namespace.ts';

/**
 * CLI helpers for working with Serve.
 */
export type ServeToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
