import type { t } from './common.ts';

type BuildModule = Pick<t.ViteEntry.Lib, 'build'>;
export type BuildLoader = () => Promise<BuildModule>;

const loadBuild: BuildLoader = () => import('./u.build.ts');

/**
 * Load and invoke only the production-build implementation.
 */
export async function build(args: t.ViteEntry.Args.Build): Promise<void> {
  await buildWith(args, loadBuild);
}

/** Internal implementation-loader seam. */
export async function buildWith(
  args: t.ViteEntry.Args.Build,
  load: BuildLoader,
): Promise<void> {
  await (await load()).build(args);
}

/**
 * Present and run one CLI build command through the shared lazy wrapper.
 */
export async function dispatch(args: t.ViteEntry.Args.Build): Promise<void> {
  await dispatchWith(args, loadBuild);
}

/** Internal implementation-loader seam for command presentation tests. */
export async function dispatchWith(
  args: t.ViteEntry.Args.Build,
  load: BuildLoader,
): Promise<void> {
  if (!args.silent) {
    const { Tasks } = await import('../m.fmt/u.Tasks.ts');
    Tasks.log({ cmd: 'build' });
  }
  await buildWith(args, load);
}
