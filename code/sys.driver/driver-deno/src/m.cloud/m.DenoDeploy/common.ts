export * from '../common.ts';

/**
 * Defaults
 */
export const D = {
  denoCommand: 'deno',
  deployEntrypointFilename: 'deploy.entry.ts',
  stageTempDirPrefix: 'sys.driver.deno.deploy.stage-',
} as const;
