import { type t, c, Fs, Tmpl } from './common.ts';
import { runTemplate } from './u.tmpl.ts';

/**
 * Helpers for establishing and updating the project environment.
 */
export const Env: t.VitePressEnvLib = {
  /**
   * Initialize template files.
   */
  async update(args = {}) {
    const { inDir = '', srcDir, version, force = false, silent = false } = args;

    /**
     * Update template files.
     */
    const tmpl = await runTemplate({ inDir, srcDir, version, force });

    /**
     * Clean away obsolete files.
     */
    const remove = (...path: string[]) => Fs.remove(Fs.join(inDir, ...path));
    await remove('src/pkg.ts');
    await remove('src/setup.ts');
    await remove('src/components');

    /**
     * Finish up.
     */
    if (!silent) {
      console.info(c.green('Updated Environment'));
      console.info(Tmpl.Log.table(tmpl.ops, { indent: 2 }));
    }

    return { tmpl };
  },
};
