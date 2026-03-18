export * from '../common.ts';

/**
 * Defaults
 */
export const D = {
  cmd: {
    deno: 'deno',
  },
  tmpDirPrefix: {
    logs: 'sys.driver.deno.deploy.logs-',
    stage: 'sys.driver.deno.deploy.stage-',
  },
} as const;
