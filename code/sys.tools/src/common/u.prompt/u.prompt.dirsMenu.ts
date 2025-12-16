import { type t, c, Cli } from './common.ts';

/**
 * Directory selection menu with optional "add" + "exit"
 * commands and tree-formatted labels.
 */
export async function promptDirsMenu<C extends string>(args: {
  message: string; //      ← e.g. 'Tools:\n'
  prefix: string; //       ← e.g. 'serve:' | 'dir:'
  cmdAdd: C; //            ← e.g. 'dir:add'
  cmdExit: C; //           ← e.g. 'exit'
  addLabel: string; //     ← e.g. 'add: <local>'
  dirs: readonly { name: string; dir: t.StringDir }[];
  branch?: (e: { readonly index: number; readonly total: number }) => string;
  paintName?: (name: string) => string;
  onSelectDir?: (dir: t.StringDir) => Promise<void>;
}): Promise<C | t.StringDir> {
  const { message, prefix, cmdAdd, cmdExit, addLabel, branch, paintName, onSelectDir } = args;

  const listing = args.dirs.map((item, index) => {
    const b = branch?.({ index, total: args.dirs.length }) ?? '';
    const nameText = paintName ? paintName(item.name) : item.name;

    const tree = Cli.Fmt.Tree.branch([index, args.dirs], 1);
    const bNorm = String(b).trim();
    const label = ` ${prefix} ${tree} ${bNorm ? `${bNorm} ` : ''}${c.green(nameText)}`.trimEnd();

    return { name: label, value: item.dir };
  });

  const options = [
    { name: addLabel, value: cmdAdd },
    ...listing,
    { name: c.gray('(exit)'), value: cmdExit },
  ];

  const defaultValue: C | t.StringDir = listing.length > 0 ? listing[0].value : cmdAdd;

  const picked: C | t.StringDir = await Cli.Input.Select.prompt({
    message,
    options,
    default: defaultValue,
    hideDefault: true,
  });

  if (picked !== cmdAdd && picked !== cmdExit) {
    await onSelectDir?.(picked);
  }

  return picked;
}
