export { Cmd, Fs, Path } from '@sys/std-s';
export * from '../common.ts';

/**
 * Constants.
 */
export const DEFAULTS = {
  port: 1234,
  path: {
    input: './index.html',
    configFile: './src/server/ViteCmd/vite.config.ts',
    outDir: './dist',
    outDirTest: './.tmp/test',
  },
} as const;
