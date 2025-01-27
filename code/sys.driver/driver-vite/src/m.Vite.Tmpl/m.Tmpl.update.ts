import { type t, c, Fs, Tmpl } from './common.ts';
import { create } from './m.Tmpl.create.ts';

/**
 * Initialize the local machine environment with latest templates
 */
export const update: t.ViteTmplLib['update'] = async (args = {}) => {
  const { version, force = false, silent = false } = args;

  /**
   * Update template files.
   */
  const tmpl = await create({ version });
  const target = args.in ?? '.';
  const { ops } = await tmpl.copy(target, { force });

  /**
   * Finish up.
   */
  if (!silent) {
    console.info(c.green('Updated Environment'));
    console.info(Tmpl.Log.table(ops, { indent: 2 }));
  }

  return { ops };
};
