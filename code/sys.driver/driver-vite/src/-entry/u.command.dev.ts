import type { t } from './common.ts';

type DevModule = Pick<t.ViteEntry.Lib, 'dev'>;
export type DevLoader = () => Promise<DevModule>;

const loadDev: DevLoader = () => import('./u.dev.ts');

/**
 * Load and invoke only the development-server implementation.
 */
export async function dev(args: t.ViteEntry.Args.Dev): Promise<void> {
  await devWith(args, loadDev);
}

/** Internal implementation-loader seam. */
export async function devWith(
  args: t.ViteEntry.Args.Dev,
  load: DevLoader,
): Promise<void> {
  await (await load()).dev(args);
}

/**
 * Present and run one CLI development command through the shared lazy wrapper.
 */
export async function dispatch(args: t.ViteEntry.Args.Dev): Promise<void> {
  await dispatchWith(args, loadDev);
}

/** Internal implementation-loader seam for command presentation tests. */
export async function dispatchWith(
  args: t.ViteEntry.Args.Dev,
  load: DevLoader,
): Promise<void> {
  const { Tasks } = await import('../m.fmt/u.Tasks.ts');
  Tasks.log({ cmd: 'dev' });
  await devWith(args, load);
}
