import { ensureFiles } from '../-tmpl/mod.ts';
import { type t, c, Fs, Log } from './common.ts';

/**
 * Helpers for establishing and updating the project environment.
 */
export const Env: t.VitePressEnvLib = {
  /**
   * Initialize template files.
   */
  async update(args = {}) {
    const { inDir = '', srcDir, version, force = false, silent = false, filter } = args;

    /**
     * Update template files.
     */
    const { files } = await ensureFiles({ inDir, srcDir, force, version, filter });

    /**
     * Clean away obsolete files.
     */
    const remove = (...path: string[]) => Fs.remove(Fs.join(inDir, ...path));
    await remove('src/pkg.ts');
    await remove('src/setup.ts');

    /**
     * Finish up.
     */
    if (!silent) {
      console.info(c.green('Updated Environment'));
      Log.filesTable(files).render();
    }
    return { files };
  },
};
