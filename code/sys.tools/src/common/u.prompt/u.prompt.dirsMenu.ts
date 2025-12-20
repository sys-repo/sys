import { type t, c, Cli } from './common.ts';

/**
 * Directory selection menu with optional "add" + "exit"
 * commands and tree-formatted labels.
 */
export async function promptDirsMenu<C extends string>(args: {
  message: string;
  prefix: string;
  cmdAdd: C;
  cmdExit: C;
  addLabel: string;
  dirs: readonly { name: string; dir: t.StringDir }[];
  branch?: (e: { readonly index: number; readonly total: number }) => string;
  paintName?: (name: string) => string;
  onSelectDir?: (dir: t.StringDir) => Promise<void>;

  /**
   * Ordering policy for displayed rows.
   * - "auto": derive a stable sort from the rendered label (default).
   * - "preserve": keep the input order exactly as provided.
   */
  order?: 'auto' | 'preserve';

  /**
   * Optional renderer for directory rows.
   * If provided, this takes ownership of per-row label text.
   * Provide sortKey only when using order "auto" and you want custom sorting.
   */
  render?: (e: { readonly name: string; readonly dir: t.StringDir }) => {
    readonly label: string;
    readonly sortKey?: string;
  };
}): Promise<C | t.StringDir> {
  const {
    message,
    prefix,
    cmdAdd,
    cmdExit,
    addLabel,
    branch,
    paintName,
    onSelectDir,
    order = 'auto',
  } = args;

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

  const defaultSortKey = (labelText: string) => Cli.stripAnsi(labelText).trim().toLowerCase();

  const renderRow = (item: { name: string; dir: t.StringDir }) => {
    const nameText = paintName ? paintName(item.name) : item.name;

    if (args.render) {
      const r = args.render({ name: nameText, dir: item.dir });
      return {
        label: r.label,
        sortKey: (r.sortKey ?? defaultSortKey(r.label)).toLowerCase(),
      };
    }

    const { key, path } = splitKeyPath(nameText);
    const sortKey = (() => {
      const p = Cli.stripAnsi(path).trim();
      const norm = p === '.' || p === './' || p === '/.' || p === '/./' ? './' : p;
      const isRoot = norm === './';
      const k = Cli.stripAnsi(key).trim();
      return `${isRoot ? '0' : '1'}|${norm.toLowerCase()}|${k.toLowerCase()}`;
    })();

    return { label: nameText, sortKey };
  };

  const rendered = args.dirs.map((d) => {
    const r = renderRow(d);
    return { ...d, _sortKey: r.sortKey, _label: r.label };
  });

  const rows =
    order === 'preserve'
      ? rendered
      : [...rendered].sort((a, b) => a._sortKey.localeCompare(b._sortKey));

  const maxPathWidth =
    args.render || order === 'preserve'
      ? 0
      : Math.max(0, ...rows.map((d) => visibleLen(splitKeyPath(d._label).path)));

  const listing = rows.map((item, index) => {
    const b = branch?.({ index, total: rows.length }) ?? '';
    const tree = Cli.Fmt.Tree.branch([index, rows], 1);
    const bNorm = String(b).trim();

    const cols = (() => {
      if (args.render || order === 'preserve') return item._label;
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
