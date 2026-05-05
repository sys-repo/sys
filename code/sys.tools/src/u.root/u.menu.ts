import { c, Cli, pkg, Str, type t } from './common.ts';
import { isToolCommand } from './u.is.ts';
import { rootRows } from './u.rows.ts';

type RootMenuAction = t.Root.Command | 'more' | 'back' | 'exit';
export type RootMenuPick =
  | { readonly kind: 'exit' }
  | { readonly kind: 'selected'; command: t.Root.Command };

const ROOT_MENU_MAX_ROWS = 20;

export async function rootMenu(args: { highlightUpdate?: boolean } = {}): Promise<RootMenuPick> {
  let scope: 'primary' | 'secondary' = 'primary';

  while (true) {
    const picked = await promptMenu(scope, args.highlightUpdate);

    if (picked === 'exit') return { kind: 'exit' };
    if (picked === 'more') {
      scope = 'secondary';
      continue;
    }
    if (picked === 'back') {
      scope = 'primary';
      continue;
    }
    if (!isToolCommand(picked)) return { kind: 'exit' };
    return { kind: 'selected', command: picked };
  }
}

export function optionLines(table: string): string[] {
  return Str.trimEdgeNewlines(table)
    .split('\n')
    .filter((line) => visibleText(line).length > 0);
}

export function optionName(line: string | undefined, fallback: string): string {
  if (visibleText(line).length > 0) return line!;
  if (visibleText(fallback).length > 0) return fallback;
  throw new Error('Root menu option name must not be blank');
}

function visibleText(input?: string): string {
  return Cli.stripAnsi(input ?? '').trim();
}

export function menuMessage(): string {
  return Str.dedent(`
    ${c.green('system:tools')}${c.gray(c.dim('@'))}${c.gray(pkg.version)}
      ${c.dim(Cli.Fmt.Tree.vert)}
  `);
}

async function promptMenu(
  scope: 'primary' | 'secondary',
  highlightUpdate?: boolean,
): Promise<RootMenuAction> {
  const rows = scope === 'primary'
    ? [
      ...toolMenuRows('primary', highlightUpdate),
      specialRow('more'),
      ...toolMenuRows('utility', highlightUpdate),
    ]
    : [...toolMenuRows('secondary', highlightUpdate), specialRow('back')];
  const options = rowsToOptions(rows);

  const picked = await Cli.Input.Select.prompt<RootMenuAction>({
    message: menuMessage(),
    options,
    hideDefault: true,
    maxRows: ROOT_MENU_MAX_ROWS,
  });

  if (isRootMenuAction(picked)) return picked;
  throw new Error(`Invalid root menu action: ${picked}`);
}

type MenuRow = { readonly value: RootMenuAction; readonly columns: readonly string[] };

function toolMenuRows(
  group: 'primary' | 'secondary' | 'utility',
  highlightUpdate?: boolean,
): MenuRow[] {
  const highlightCommand = highlightUpdate ? 'update' : undefined;
  return rootRows(group, { highlightCommand }).map((row) => ({
    value: row.command,
    columns: row.columns,
  }));
}

function isRootMenuAction(value: string): value is RootMenuAction {
  return value === 'more' || value === 'back' || value === 'exit' || isToolCommand(value);
}

function rowsToOptions(rows: readonly MenuRow[]) {
  const table = Cli.table([]);
  const exitLabel = c.gray('(exit)');
  const exitIndent = ' '.repeat(Cli.Fmt.Tree.branch([0, rows]).length);
  const treeRows = rows.filter((row) => row.value !== 'back' && row.value !== 'more');

  rows.forEach((row, index) => {
    if (row.value === 'back') {
      table.push([` ${row.columns[0]}`]);
      return;
    }

    if (row.value === 'more') {
      table.push([`${c.dim(Cli.Fmt.Tree.vert)}     ${row.columns[0]}`]);
      return;
    }

    const treeIndex = treeRows.findIndex((item) => item === row);
    const branch = treeIndex === treeRows.length - 1
      ? Cli.Fmt.Tree.branch(true, 1)
      : Cli.Fmt.Tree.branch([treeIndex, treeRows]);
    table.push([`${c.dim(branch)} ${row.columns[0]}`, ...row.columns.slice(1)]);
  });

  table.push([`${exitIndent}${exitLabel}`]);

  const lines = optionLines(table.toString());
  const options: Array<{ name: string; value: RootMenuAction }> = rows.map((row, index) => ({
    name: optionName(lines[index], row.columns.join(' ')),
    value: row.value,
  }));

  options.push({
    name: optionName(lines[rows.length], c.gray('(exit)')),
    value: 'exit',
  });

  return options;
}

function specialRow(kind: 'more' | 'back'): MenuRow {
  return {
    value: kind,
    columns: [
      kind === 'more' ? c.gray(c.italic('more...')) : c.gray('← back'),
    ],
  };
}
