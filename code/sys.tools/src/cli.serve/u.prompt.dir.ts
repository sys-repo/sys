import { type t, c, opt, Prompt } from './common.ts';
import { Fmt } from './u.fmt.ts';

type C = t.ServeTool.Command;
type Dir = { name: string; dir: t.StringDir };

export async function promptDirsMenu(args: {
  readonly message: string; //          e.g. 'Tools:\n'
  readonly prefix: string; //           e.g. 'serve:'
  readonly dirs: readonly Dir[];
  readonly cmdAdd: C; //                'modify:add'
  readonly cmdExit: C; //               'exit'
  readonly addLabel: string; //         'add: <dir>'
  readonly onSelectDir?: (dir: t.StringDir) => Promise<void>;
}): Promise<C> {
  const { message, prefix, cmdAdd, cmdExit, addLabel, onSelectDir } = args;

  const listing = args.dirs.map((item, i, all) => {
    const branch = Fmt.Tree.branch([i, all]);
    const name = ` ${prefix} ${branch} ${c.green(item.name)}`;
    return { name, value: item.dir as C };
  });

  const defaultCommand = listing.length > 0 ? listing[0].value : cmdAdd;

  const picked = (await Prompt.Select.prompt<C>({
    message,
    options: [opt(addLabel, cmdAdd), ...listing, opt(c.gray('(exit)'), cmdExit)],
    default: defaultCommand,
    hideDefault: true,
  })) as C;

  // If a dir was selected, touch it (persist lastUsedAt) so next run's orderByRecency works.
  if (picked !== cmdAdd && picked !== cmdExit) {
    await onSelectDir?.(picked as unknown as t.StringDir);
  }

  return picked;
}
