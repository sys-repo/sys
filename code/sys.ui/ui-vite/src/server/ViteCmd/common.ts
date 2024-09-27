import { Path } from '@sys/std-s';

export { Cmd, Fs, Path } from '@sys/std-s';
export * from '../common.ts';

/**
 * Constants.
 */
export const DEFAULTS = {
  path: {
    input: Path.join(import.meta.dirname, 'vite.index.html'),
    configFile: './src/server/ViteCmd/vite.config.ts',
    outDir: './dist',
    outDirTest: './.tmp/test',
  },
} as const;
