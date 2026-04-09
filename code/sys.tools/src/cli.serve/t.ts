import type { t } from './common.ts';

/** Type exports */
export type * from './t.mime.ts';
export type * from './t.namespace.ts';

/**
 * CLI helpers for working with Serve.
 */
export type ServeToolsLib = {
  /** Run the serve CLI flow (interactive by default, strict with `--no-interactive`). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
