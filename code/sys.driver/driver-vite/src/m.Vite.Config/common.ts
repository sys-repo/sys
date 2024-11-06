export * from '../common.ts';

/**
 * Constants.
 */
export const DEFAULTS = {
  path: {
    input: './index.html',
    outDir: './dist',
    outDirTesting: './.tmp/testing',
  },
} as const;
