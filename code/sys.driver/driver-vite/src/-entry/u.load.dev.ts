import type { t } from './common.ts';

/** Load the development command wrapper. */
export const load = () => import('./u.command.dev.ts');

/**
 * Public development proxy bound to the production command loader.
 */
export const dev: t.ViteEntry.Lib['dev'] = async (args) => {
  await (await load()).dev(args);
};
