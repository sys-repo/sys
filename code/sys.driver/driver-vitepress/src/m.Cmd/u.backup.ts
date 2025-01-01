import { type t, Args, Cli, Dir, Log, Path, PATHS } from './common.ts';

/**
 * Perform a snapshot backup on the project.
 */
export async function backup(argv: string[]) {
  const args = Args.parse<t.CmdArgsBackup>(argv);
  const { inDir = PATHS.inDir } = args;
  if (args.cmd !== 'backup') return;

  const source = Path.join(inDir);
  const target = Path.join(inDir, PATHS.backup);

  const filter: t.FsCopyFilter = (path) => {
    if (path.endsWith(`/${PATHS.backup}`)) return false;
    return true;
  };

  // Copy directory snapshot.
  const spinner = Cli.spinner('').start();
  const snapshot = await Dir.snapshot({ source, target, filter });
  spinner.stop().clear();

  // Log output.
  await Log.Snapshot.log(snapshot);
  console.info();

  // Finish up.
  return snapshot;
}
