import { type t, Args, Dir, Path, PATHS } from './common.ts';

/**
 * Perform a snapshot backup on the project.
 */
export async function backup(argv: string[], options: { inDir?: t.StringDir } = {}) {
  const { inDir = PATHS.inDir } = options;

  const args = Args.parse<t.CmdArgsBackup>(argv);
  if (args.cmd !== 'backup') return;

  const source = Path.join(inDir);
  const target = Path.join(inDir, PATHS.backup);
  const res = await Dir.snapshot(source, target);

  return res;
}
