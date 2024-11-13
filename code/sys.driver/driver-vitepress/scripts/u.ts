import { Fs } from '../src/common.ts';

/**
 * Helpers for the scripts.
 */
export const SCRIPT = {
  /**
   * Setup standard/sample environment.
   */
  async env(options: { force?: boolean } = {}) {
    const { force = false } = options;
    const sampleDir = Fs.resolve('./src/-test/vitepress.sample-1');
    const inDir = './.tmp/docs';
    const outDir = './dist';

    if (force || !(await Fs.exists(inDir))) {
      await Fs.copy(sampleDir, inDir);
    }

    return { inDir, outDir } as const;
  },
};
