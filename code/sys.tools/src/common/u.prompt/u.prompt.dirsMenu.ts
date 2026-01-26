import { type t, c, Cli } from './common.ts';

type Label = t.Tools.Prompt.Dirs.MenuLabel;

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
  exitLabel?: string;

  /**
   * Row label as explicit columns.
   * - key: required
   * - path: optional (when absent, second column renders blank)
   */
  dirs: t.Ary<t.Tools.Prompt.Dirs.MenuEntry>;
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
  render?: t.Tools.Prompt.Dirs.RenderRow;
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
  const hasAnsi = (s: string) => Cli.stripAnsi(s) !== s;

  const paintPath = (path?: string) => {
    const v = String(path ?? '').trim();
    if (!v) return '';
    return hasAnsi(v) ? v : c.gray(v);
  };

  const splitLabel = (label: Label) => {
    const key = String(label[0] ?? '').trim();
    const path = String(label[1] ?? '').trim();
    return { key, path };
  };

  const padRightVisible = (s: string, width: number): string => {
    const pad = width - visibleLen(s);
    return pad > 0 ? `${s}${' '.repeat(pad)}` : s;
  };

  const defaultSortKey = (s: string) => Cli.stripAnsi(s).trim().toLowerCase();

  type Row = {
    readonly name: Label;
    readonly dir: t.StringDir;
    readonly _sortKey: string;
    readonly _label: string | Label;
  };

  const renderRow = (item: {
    readonly name: Label;
    readonly dir: t.StringDir;
  }): Pick<Row, '_label' | '_sortKey'> => {
    const nameText: Label = (() => {
      const k0 = item.name[0] ?? '';
      const p0 = item.name[1];
      const k = paintName ? paintName(String(k0)) : String(k0);
      return [k, p0] as const;
    })();

    if (args.render) {
      const r = args.render({ name: nameText, dir: item.dir });
      return {
        _label: r.label,
        _sortKey: r.sortKey ?? defaultSortKey(r.label),
      };
    }

    const { key, path } = splitLabel(nameText);
    const p = Cli.stripAnsi(path).trim();
    const norm = p === '.' || p === './' || p === '/.' || p === '/./' ? './' : p;
    const isRootish = !norm || norm === './';
    const k = Cli.stripAnsi(key).trim();

    return {
      _label: nameText,
      _sortKey: `${isRootish ? '0' : '1'}|${norm.toLowerCase()}|${k.toLowerCase()}`,
    };
  };

  const rendered: Row[] = args.dirs.map((d) => ({ ...d, ...renderRow(d) }));
  const rows: Row[] =
    order === 'preserve'
      ? rendered
      : [...rendered].sort((a, b) => a._sortKey.localeCompare(b._sortKey));

  const maxKeyWidth = args.render
    ? 0
    : Math.max(0, ...rows.map((d) => visibleLen(splitLabel(d._label as Label).key)));

  const listing = rows.map((item, index) => {
    const b = branch?.({ index, total: rows.length }) ?? '';
    const tree = Cli.Fmt.Tree.branch([index, rows], 1);
    const bNorm = String(b).trim();

    const cols = (() => {
      if (args.render) return item._label as string;

      const { key, path } = splitLabel(item._label as Label);
      const left = padRightVisible(key, maxKeyWidth);
      const right = paintPath(path);
      return right ? `${left}  ${right}` : `${left}  `;
    })();

    const label = ` ${prefix} ${tree} ${bNorm ? `${bNorm} ` : ''}${cols}`.trimEnd();
    return { name: label, value: item.dir };
  });

  const exitLabel = args.exitLabel ?? c.gray('(exit)');
  const options = [
    { name: addLabel, value: cmdAdd },
    ...listing,
    { name: exitLabel, value: cmdExit },
  ];

  const defaultValue: C | t.StringDir = listing.length > 0 ? listing[0].value : cmdAdd;
  const picked: C | t.StringDir = await Cli.Input.Select.prompt({
    message,
    options,
    default: defaultValue,
    hideDefault: true,
  });

  if (picked !== cmdAdd && picked !== cmdExit) await onSelectDir?.(picked);
  return picked;
}
