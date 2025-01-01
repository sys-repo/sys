import { type t, Args, PATHS, Fs, Path } from './common.ts';

/**
 * Clean the project of temporary files.
 */
export async function clean(argv: string[], options: { inDir?: t.StringDir } = {}) {
  const args = Args.parse<t.CmdArgsClean>(argv);
  const { inDir = PATHS.inDir } = args;
  if (args.cmd !== 'clean') return;

  const join = (...path: string[]) => Path.join(inDir, ...path);
  await Fs.remove(join('dist'), { log: true });
}
