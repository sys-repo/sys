import { type t, c, Fs, Tmpl } from './common.ts';
import { create } from './u.create.ts';

/**
 * Initialize the local machine environment with latest templates
 */
export const update: t.ViteTmplLib['update'] = async (args = {}) => {
  const { version, force = false, silent = false } = args;

  /**
   * Update template files.
   */
  const tmpl = await create({ version });
  const dir = args.in ?? '.';
  const { ops } = await tmpl.copy(dir, { force });

  /**
   *  🫵  Clean up helpers here (flesh out as needed: 🐷).
   *      eg. migration change patching.
   */
  const remove = (...path: string[]) => Fs.remove(Fs.join(dir, ...path));
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
