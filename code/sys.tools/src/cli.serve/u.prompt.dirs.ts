import { type t, c, promptDirsMenu } from './common.ts';
import { Fmt } from './u.fmt.ts';

type C = t.ServeTool.Command;

export async function promptServeDirsMenu(args: {
  readonly dirs: readonly { name: string; dir: t.StringDir }[];
  readonly onSelectDir?: (dir: t.StringDir) => Promise<void>;
}): Promise<C> {
  return await promptDirsMenu<C>({
    message: 'Tools:\n',
    prefix: 'serve:',
    dirs: args.dirs,
    cmdAdd: 'modify:add',
    cmdExit: 'exit',
    addLabel: '   add: <local>',
    branch: ({ index, total }) => Fmt.Tree.branch([index, total]),
    paintName: (s) => c.green(s),
    onSelectDir: args.onSelectDir,
  });
}
