import { type t, c, Cli, pkg, Str } from './common.ts';
import { isToolCommand } from './u.is.ts';
import { rootRows } from './u.rows.ts';

export type RootMenuPick =
  | { readonly kind: 'exit' }
  | { readonly kind: 'selected'; command: t.Root.Command };

export async function rootMenu(): Promise<RootMenuPick> {
  const rows = rootRows();
  const table = Cli.table([]);
  const total = rows.length;
  const exitLabel = c.gray('(exit)');
  const exitIndent = ' '.repeat(Cli.Fmt.Tree.branch([0, rows]).length);

  rows.forEach((row, index) => {
    const branch = index === total - 1
      ? Cli.Fmt.Tree.branch(true, 1)
      : Cli.Fmt.Tree.branch([index, rows]);
    table.push([`${c.dim(branch)} ${row.columns[0]}`, ...row.columns.slice(1)]);
  });

  table.push([`${exitIndent}${exitLabel}`]);

  const lines = Str.trimEdgeNewlines(table.toString()).split('\n');
  const options: Array<{ name: string; value: t.Root.Command | 'exit' }> = rows.map(
    (row, index) => ({
      name: lines[index] ?? row.columns.join(' '),
      value: row.command,
    }),
  );

  options.push({ name: lines[rows.length] ?? c.gray('(exit)'), value: 'exit' as const });

  console.info();
  const picked = await Cli.Input.Select.prompt<t.Root.Command | 'exit'>({
    message: [
      `${c.green('system:tools')}${c.gray(c.dim('@'))}${c.gray(pkg.version)}`,
      `  ${c.dim(Cli.Fmt.Tree.vert)}`,
    ].join('\n'),
    options,
    hideDefault: true,
  });

  if (picked === 'exit') return { kind: 'exit' };
  if (!isToolCommand(picked)) return { kind: 'exit' };
  return { kind: 'selected', command: picked };
}
