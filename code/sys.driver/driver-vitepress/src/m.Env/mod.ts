import { type t, c } from './common.ts';
import { ensureFiles } from './u.ensureFiles.ts';

/**
 * Helpers for establishing and updating the project environment.
 */
export const Env: t.VitePressEnvLib = {
  /**
   * Initialize template files.
   */
  async update(args = {}) {
    const { inDir = '', srcDir, force = false, silent = false, filter } = args;
    const { files, table } = await ensureFiles({ inDir, srcDir, force, filter });
    if (!silent) {
      console.info(c.green('Update Environment'));
      table.render();
    }

    return { files };
  },
};
