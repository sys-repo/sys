import type { t } from './common.ts';

/** Load the verified-Dist serve command wrapper. */
export const load = () => import('./u.command.serve.ts');

/**
 * Public serve proxy bound to the production command loader.
 */
export const serve: t.ViteEntry.Lib['serve'] = async (args) => {
  await (await load()).serve(args);
};
