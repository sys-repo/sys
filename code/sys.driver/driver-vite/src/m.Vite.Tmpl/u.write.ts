import { type t, c, Fs, Tmpl } from './common.ts';
import { create } from './u.create.ts';

/**
 * Write and process the templates to the local file-system.
 */
export const write: t.ViteTmplLib['write'] = async (args = {}) => {
  const { version, force = false, silent = false } = args;

  /**
   * Update template files.
   */
  const tmpl = await create({ version, tmpl: args.tmpl ?? 'Default' });
  const dir = args.in ?? '.';
  const { ops } = await tmpl.write(dir, { force });

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
