import { type t, c, Cli, pkg, Str } from './common.ts';
import { rootRows } from './u.rows.ts';

export async function printRootHelp(args: t.Root.CliRootParsedArgs) {
  const table = Cli.table([]);
  const rows = rootRows();
  const helpRows = [pkg.name, ...rows.map((row) => row.command)] as const;

  table.push([
    ` ${c.dim(Cli.Fmt.Tree.branch([0, helpRows]))} ${c.bold(c.white(pkg.name))}`,
    c.cyan(pkg.version),
  ]);
  rows.forEach((row, index) => {
    const branch = Cli.Fmt.Tree.branch([index + 1, helpRows]);
    table.push([` ${c.dim(branch)} ${row.columns[0]}`, ...row.columns.slice(1)]);
  });

  const text = Str.builder()
    .line()
    .line(c.gray(`${c.green(' system:tools')} `))
    .line(Str.trimEdgeNewlines(table.toString()))
    .line()
    .toString();

  console.info(text);

  if (args.help) {
    const cmd = 'deno run -A jsr:@sys/tools';
    const alias = `${c.italic(c.cyan('alias'))} ${c.white('sys')}=${c.yellow(`"${cmd}"`)}`;
    const str = Str.builder()
      //
      .line(`  shortcut: ${alias}`)
      .blank();
    console.info(c.gray(String(str)));
  }
}
