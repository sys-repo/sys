import { type t, c, Fs, Tmpl } from './common.ts';
import { create } from './u.create.ts';

/**
 * Write and process the templates to the local file-system.
 */
export const write: t.VitepressTmplLib['write'] = async (args = {}) => {
  const { inDir = '', srcDir, version, force = false, silent = false } = args;

  /**
   * Update template files.
   */
  const tmpl = await create({ inDir, srcDir, version });
  const copied = await tmpl.write(inDir, { force });
  const { ops } = copied;

  /**
   *  🫵  Clean up helpers here (flesh out as needed: 🐷).
   *      eg. migration change patching.
   */
  const remove = (...path: string[]) => Fs.remove(Fs.join(inDir, ...path));
  // await remove('./<path>');

  /**
   * Finish up.
   */
  if (!silent) {
    console.info(c.cyan('Updated Environment'));
    console.info(c.white('  ↓'));
    console.info(Tmpl.Log.table(ops, { indent: 2 }));
  }

  return { ops };
};
