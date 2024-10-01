export * from '../common.ts';

/**
 * Constants.
 */
export const DEFAULTS = {
  path: {
    input: './index.html',
    outDir: './dist',
    outDirTest: './.tmp/test',
  },
} as const;
