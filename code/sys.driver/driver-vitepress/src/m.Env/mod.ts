import { type t, c, Log } from './common.ts';
import { ensureFiles } from './u.ensureFiles.ts';

/**
 * Helpers for establishing and updating the project environment.
 */
export const Env: t.VitePressEnvLib = {
  /**
   * Initialize template files.
   */
  async update(args = {}) {
    const { inDir = '', srcDir, version, force = false, silent = false, filter } = args;
    const { files } = await ensureFiles({ inDir, srcDir, force, version, filter });
    if (!silent) {
      console.info(c.green('Updated Environment'));
      Log.filesTable(files).render();
    }
    return { files };
  },
};
