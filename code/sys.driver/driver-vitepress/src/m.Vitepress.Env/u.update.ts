import { type t, c, Fs, Tmpl, VitepressTmpl } from './common.ts';

/**
 * Initialize the local machine environment with latest templates
 */
export const update: t.VitepressEnvLib['update'] = async (args = {}) => {
  const { inDir = '', srcDir, version, force = false, silent = false } = args;

  /**
   * Update template files.
   */
  const tmpl = await VitepressTmpl.create({ inDir, srcDir, version });
  const { ops } = await tmpl.copy(inDir, { force });

  /**
   * Clean away obsolete files (historical).
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
    console.info(Tmpl.Log.table(ops, { indent: 2 }));
  }

  return { ops };
};
