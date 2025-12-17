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

  const visibleLen = (s: string) => Cli.stripAnsi(s).length;

  /**
   * Expect "<key>  <path>" (2+ spaces).
   * If no path is present, normalize display to "./" so left column never collapses.
   */
  const splitKeyPath = (text: string): { readonly key: string; readonly path: string } => {
    const parts = text.split(/\s{2,}/);
    const key = (parts[0] ?? '').trim();
    const path = (parts.slice(1).join('  ') ?? '').trim();
    return { key, path: path || './' };
  };

  const padRightVisible = (s: string, width: number): string => {
    const pad = width - visibleLen(s);
    return pad > 0 ? `${s}${' '.repeat(pad)}` : s;
  };

  const maxPathWidth = Math.max(
    0,
    ...args.dirs.map((d) => {
      const text = paintName ? paintName(d.name) : d.name;
      const { path } = splitKeyPath(text);
      return visibleLen(path);
    }),
  );

  const normalizePathForSort = (path: string): string => {
    const p = Cli.stripAnsi(path).trim();
    if (p === '.' || p === './' || p === '/.' || p === '/./') return './';
    return p;
  };

  const sortedDirs = [...args.dirs].sort((a, b) => {
    const aText = paintName ? paintName(a.name) : a.name;
    const bText = paintName ? paintName(b.name) : b.name;

    const aSplit = splitKeyPath(aText);
    const bSplit = splitKeyPath(bText);

    const aPath = normalizePathForSort(aSplit.path);
    const bPath = normalizePathForSort(bSplit.path);

    const aIsRoot = aPath === './';
    const bIsRoot = bPath === './';

    if (aIsRoot !== bIsRoot) return aIsRoot ? -1 : 1;

    const pathCmp = aPath.localeCompare(bPath);
    if (pathCmp !== 0) return pathCmp;

    const aKey = Cli.stripAnsi(aSplit.key);
    const bKey = Cli.stripAnsi(bSplit.key);
    return aKey.localeCompare(bKey);
  });

  const listing = sortedDirs.map((item, index) => {
    const b = branch?.({ index, total: sortedDirs.length }) ?? '';
    const nameText = paintName ? paintName(item.name) : item.name;

    const tree = Cli.Fmt.Tree.branch([index, sortedDirs], 1);
    const bNorm = String(b).trim();

    const { key, path } = splitKeyPath(nameText);
    const left = padRightVisible(path, maxPathWidth);
    const cols = c.gray(`${left}  mount:/${c.cyan(key)}`);

    const label = ` ${prefix} ${tree} ${bNorm ? `${bNorm} ` : ''}${cols}`.trimEnd();
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
