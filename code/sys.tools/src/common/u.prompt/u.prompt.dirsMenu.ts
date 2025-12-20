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

  /**
   * Optional renderer for directory rows.
   * If provided, this takes ownership of per-row label text and sort order.
   */
  render?: (e: { readonly name: string; readonly dir: t.StringDir }) => {
    readonly label: string;
    readonly sortKey?: string;
  };
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

  const defaultSortKey = (nameText: string) => Cli.stripAnsi(nameText).trim().toLowerCase();
  const renderRow = (item: { name: string; dir: t.StringDir }) => {
    const nameText = paintName ? paintName(item.name) : item.name;

    if (args.render) {
      const r = args.render({ name: nameText, dir: item.dir });
      return {
        sortKey: (r.sortKey ?? defaultSortKey(nameText)).toLowerCase(),
        label: r.label,
      };
    }

    const { key, path } = splitKeyPath(nameText);
    return {
      sortKey: (() => {
        const p = Cli.stripAnsi(path).trim();
        const norm = p === '.' || p === './' || p === '/.' || p === '/./' ? './' : p;
        const isRoot = norm === './';
        const k = Cli.stripAnsi(key).trim();
        return `${isRoot ? '0' : '1'}|${norm.toLowerCase()}|${k.toLowerCase()}`;
      })(),
      label: nameText,
    };
  };

  const rendered = args.dirs.map((d) => {
    const r = renderRow(d);
    return { ...d, _sortKey: r.sortKey, _label: r.label };
  });

  const sortedDirs = [...rendered].sort((a, b) => a._sortKey.localeCompare(b._sortKey));
  const maxPathWidth = args.render
    ? 0
    : Math.max(0, ...sortedDirs.map((d) => visibleLen(splitKeyPath(d._label).path)));

  const listing = sortedDirs.map((item, index) => {
    const b = branch?.({ index, total: sortedDirs.length }) ?? '';
    const tree = Cli.Fmt.Tree.branch([index, sortedDirs], 1);
    const bNorm = String(b).trim();

    const cols = (() => {
      if (args.render) return item._label;
      const { key, path } = splitKeyPath(item._label);
      const left = padRightVisible(path, maxPathWidth);
      return c.gray(`${left}  mount:/${c.cyan(key)}`);
    })();

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
