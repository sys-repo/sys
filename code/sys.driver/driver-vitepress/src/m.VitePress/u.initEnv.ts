import { type t, c, ensureFiles } from './common.ts';

type F = t.VitePressEnvLib['init'];

export const init: F = async (args = {}) => {
  const { inDir = '', srcDir, force = false, silent = false, filter } = args;
  const files = await ensureFiles({ inDir, srcDir, force, filter });
  if (!silent) {
    console.info(c.green('Update Environment'));
    files.table.render();
  }
};
