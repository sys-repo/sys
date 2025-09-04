import type { t } from './common.ts';

/**
 * CLI input parameters for starting a static HTTP server.
 */
export type HttpServeInput = {
  port?: number;
  dir?: t.StringDir;
};
