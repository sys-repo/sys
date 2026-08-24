import type { t } from './common.ts';
import { DenoFile } from '@sys/driver-deno/runtime';
import { Path } from '@sys/fs/path';
import { Pkg } from '@sys/std/pkg';
import { build as viteBuild } from '../m.vite/u/u.build.ts';

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
