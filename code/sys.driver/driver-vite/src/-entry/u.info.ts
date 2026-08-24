import type { t } from './common.ts';
import { Path } from '@sys/fs/path';
import { pkg } from '../pkg.ts';
import { Help } from '../m.fmt/u.Help.ts';
import { pathsFromConfigfile } from '../m.vite/u/u.pathsFromConfigfile.ts';

/**
 * Present package and output-path information for one Vite project.
 */
export async function info(args: t.ViteEntry.Args.Info): Promise<void> {
  if (args.cmd !== 'info') return;

  const paths = await pathsFromConfigfile(args.dir);
  const dirs = {
    in: Path.join(paths.cwd, paths.app.entry),
    out: Path.join(paths.cwd, paths.app.outDir),
  };

  let tasks: false | undefined;
  if (args.info === true) tasks = false; // NB: omit common tasks for specific info requests.
  await Help.log({ pkg, dirs, tasks });
}
