import type { t } from './common.ts';

/** Load the build command wrapper. */
export const load = () => import('./u.command.build.ts');

/**
 * Public build proxy bound to the production command loader.
 */
export const build: t.ViteEntry.Lib['build'] = async (args) => {
  await (await load()).build(args);
};
