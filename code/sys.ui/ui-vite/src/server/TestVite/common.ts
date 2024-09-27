import { Path } from '@sys/std-s';

export { Cmd, Fs, Path } from '@sys/std-s';
export * from '../common.ts';

/**
 * Constants.
 */
export const DEFAULTS = {
  path: {
    input: Path.join(import.meta.dirname, 'vite.index.html'),
    outDir: './.tmp/test/dist',
    configFile: './src/server/TestVite/vite.config.ts',
  },
} as const;
