export * from '../common.ts';

/**
 * Defaults
 */
export const D = {
  denoCommand: 'deno',
  deployEntrypointFilename: 'entry.paths.ts',
  stageTempDirPrefix: 'sys.driver.deno.deploy.stage-',
} as const;
