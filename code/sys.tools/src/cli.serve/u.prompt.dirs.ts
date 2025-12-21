import { type t, promptDirsMenu } from './common.ts';

type Cmd = t.ServeTool.Command;

/**
 * Serve tool directory menu.
 * Returns either a command (e.g. `dir:add` / `exit`) or a selected directory.
 */
export async function promptServeDirsMenu(args: {
  dirs: t.Ary<t.Tools.Prompt.Dirs.MenuEntry>;
  onSelectDir?: (dir: t.StringDir) => Promise<void>;
}): Promise<Cmd | t.StringDir> {
  const { onSelectDir } = args;
  return await promptDirsMenu<Cmd>({
    message: 'Tools:\n',
    prefix: 'serve:',
    dirs: args.dirs,
    cmdAdd: 'dir:add',
    cmdExit: 'exit',
    addLabel: '   add: <local>',
    onSelectDir,
  });
}
