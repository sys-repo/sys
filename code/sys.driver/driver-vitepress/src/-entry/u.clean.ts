import { type t, Args, Fs, Path, PATHS } from './common.ts';

/**
 * Clean the project of temporary files.
 */
export async function clean(argv: string[]) {
  const args = Args.parse<t.EntryArgsClean>(argv);
  const { inDir = PATHS.inDir } = args;
  if (args.cmd !== 'clean') return;

  const join = (...path: string[]) => Path.join(inDir, ...path);
  await Fs.remove(join(PATHS.dist), { log: true });
}
