import { type t, Args } from './common.ts';

/**
 * Perform a snapshot backup on the project.
 */
export async function backup(argv: string[]) {
  const args = Args.parse<t.CmdArgsBackup>(argv);
  if (args.cmd !== 'backup') return;

  console.log('backup', args);
}
