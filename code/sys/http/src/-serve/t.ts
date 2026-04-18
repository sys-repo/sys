import type { t } from './common.ts';

/**
 * CLI input parameters for starting a static HTTP server.
 */
export type HttpServeArgs = {
  /** Port to serve on. */
  readonly port?: number;
  /** Directory to serve. */
  readonly dir?: t.StringDir;
  /** Disable the interactive keyboard listener. */
  readonly 'non-interactive'?: boolean;
  /** Runtime keyboard-listener override. */
  readonly keyboard?: boolean;
};
