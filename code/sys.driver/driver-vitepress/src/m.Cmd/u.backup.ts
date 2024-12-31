import { type t, Args, PATHS } from './common.ts';

/**
 * Perform a snapshot backup on the project.
 */
export async function backup(argv: string[], options: { inDir?: t.StringDir } = {}) {
  const { inDir = PATHS.inDir } = options;

  const args = Args.parse<t.CmdArgsBackup>(argv);
  if (args.cmd !== 'backup') return;

  console.log('backup', args);
}
