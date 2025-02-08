import { type t, Fs, Path, PATHS } from './common.ts';

/**
 * Clean the project of temporary files.
 */
export async function clean(args: t.ViteEntryArgsClean) {
  const { dir = '.' } = args;
  if (args.cmd !== 'clean') return;

  const join = (...path: string[]) => Path.resolve(dir, ...path);
  const log = true;
  await Fs.remove(join(PATHS.dist), { log });
  await Fs.remove(join(PATHS.tmp), { log });
}
