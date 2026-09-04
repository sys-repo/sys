import type { t } from '../common.ts';
import { DenoFile } from '@sys/driver-deno/runtime';
import { Path } from '@sys/fs/path';
import { Pkg } from '@sys/std/pkg';
import { build as viteBuild } from '../../m.vite/u/u.build.ts';

/**
 * Build a production bundle from entry command args.
 */
export async function build(args: t.ViteEntry.Args.Build) {
  const { silent } = args;
  if (args.cmd !== 'build') return;
  if (!silent) console.info();

  const cwd = args.dir ? Path.resolve(args.dir) : Path.cwd();
  const pkg = Pkg.toPkg((await DenoFile.load(cwd)).data);
  const bundle = await viteBuild({ cwd, pkg, silent, spinner: true });

  if (!silent) {
    console.info(bundle.toString({ pad: true }));
  }
}

/** Present and run the selected build command. */
export async function dispatch(args: t.ViteEntry.Args.Build): Promise<void> {
  await dispatchWith(args, build);
}

/** Internal command-runner seam for presentation tests. */
export async function dispatchWith(
  args: t.ViteEntry.Args.Build,
  run: (args: t.ViteEntry.Args.Build) => Promise<void>,
): Promise<void> {
  if (!args.silent) {
    const { Tasks } = await import('../../m.fmt/u.Tasks.ts');
    Tasks.log({ cmd: 'build' });
  }
  await run(args);
}
