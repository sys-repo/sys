import { type t, Fs, Path, PATHS } from './common.ts';

/**
 * Clean the project of temporary files.
 */
export async function clean(args: t.VitepressEntryArgsClean) {
  const { inDir = PATHS.inDir } = args;
  if (args.cmd !== 'clean') return;

  const join = (...path: string[]) => Path.join(inDir, ...path);
  await Fs.remove(join(PATHS.dist), { log: true });
}
