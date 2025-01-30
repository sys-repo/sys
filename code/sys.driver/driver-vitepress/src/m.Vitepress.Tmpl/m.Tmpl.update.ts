import { type t, c, Fs, Tmpl } from './common.ts';
import { create } from './m.Tmpl.create.ts';

/**
 * Initialize the local machine environment with latest templates
 */
export const update: t.VitepressTmplLib['update'] = async (args = {}) => {
  const { inDir = '', srcDir, version, force = false, silent = false } = args;

  /**
   * Update template files.
   */
  const tmpl = await create({ inDir, srcDir, version });
  const copied = await tmpl.copy(inDir, { force });
  const { ops } = copied;

  /**
   *  🫵  Clean up helpers here (flesh out as needed: 🐷).
   *      eg. migration change patching.
   */
  const remove = (...path: string[]) => Fs.remove(Fs.join(inDir, ...path));
  // await remove('./path/to/obsolete/file');

  /**
   * Finish up.
   */
  if (!silent) {
    console.info(c.green('Updated Environment'));
    console.info(Tmpl.Log.table(ops, { indent: 2 }));
  }

  return { ops };
};
