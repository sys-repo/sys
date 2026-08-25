import type { t } from './common.ts';

type InfoModule = {
  info(args: t.ViteEntry.Args.Info): Promise<void>;
};
export type InfoLoader = () => Promise<InfoModule>;

const loadInfo: InfoLoader = () => import('./u.info.ts');

/**
 * Load and invoke only the package-information implementation.
 */
export async function dispatch(args: t.ViteEntry.Args.Info): Promise<void> {
  await dispatchWith(args, loadInfo);
}

/** Internal implementation-loader seam. */
export async function dispatchWith(
  args: t.ViteEntry.Args.Info,
  load: InfoLoader,
): Promise<void> {
  await (await load()).info(args);
}
