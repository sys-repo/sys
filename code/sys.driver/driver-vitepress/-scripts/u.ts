import { Fs } from '../src/common.ts';

export * from '../src/common.ts';
export { pkg } from '../src/pkg.ts';

/**
 * Helpers for the scripts.
 */
export const TMP = {
  /**
   * Setup standard/sample environment.
   */
  async env(options: { force?: boolean } = {}) {
    const { force = false } = options;
    const sampleDir = Fs.resolve('./src/-test/vitepress.sample-1');
    const inDir = './.tmp/docs.scripts.src';
    const outDir = './dist';

    if (force || !(await Fs.exists(inDir))) {
      await Fs.copy(sampleDir, inDir);
    }

    return { inDir, outDir } as const;
  },
};
