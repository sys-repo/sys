import { type t, promptDirsMenu } from './common.ts';

type C = t.ServeTool.Command;

/**
 * Serve tool directory menu.
 *
 * Returns either a command (`dir:add` / `exit`) or a selected directory.
 */
export async function promptServeDirsMenu(args: {
  dirs: t.Ary<{ name: string; dir: t.StringDir }>;
  onSelectDir?: (dir: t.StringDir) => Promise<void>;
}): Promise<C | t.StringDir> {
  const { onSelectDir } = args;
  return await promptDirsMenu<C>({
    // Note: rely on promptDirsMenu's canonical styling (no per-item decoration here).
    message: 'Tools:\n',
    prefix: 'serve:',
    dirs: args.dirs,
    cmdAdd: 'dir:add',
    cmdExit: 'exit',
    addLabel: '   add: <local>',
    onSelectDir,
  });
}
