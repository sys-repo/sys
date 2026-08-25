import type { t } from './common.ts';

type ServeModule = Pick<t.ViteEntry.Lib, 'serve'>;
export type ServeLoader = () => Promise<ServeModule>;

const loadServe: ServeLoader = () => import('./u.serve.ts');

/**
 * Load and invoke only the verified-Dist serve implementation.
 */
export async function serve(args: t.ViteEntry.Args.Serve): Promise<void> {
  await serveWith(args, loadServe);
}

/** Internal implementation-loader seam. */
export async function serveWith(
  args: t.ViteEntry.Args.Serve,
  load: ServeLoader,
): Promise<void> {
  await (await load()).serve(args);
}

/**
 * Present and run one CLI serve command through the shared lazy wrapper.
 */
export async function dispatch(args: t.ViteEntry.Args.Serve): Promise<void> {
  await dispatchWith(args, loadServe);
}

/** Internal implementation-loader seam for command presentation tests. */
export async function dispatchWith(
  args: t.ViteEntry.Args.Serve,
  load: ServeLoader,
): Promise<void> {
  if (!args.silent) {
    const { Tasks } = await import('../m.fmt/u.Tasks.ts');
    Tasks.log({ cmd: 'serve' });
    console.info();
  }
  await serveWith(args, load);
}
