import { type t, c, Cli, pkg } from './common.ts';
import { rootRows } from './u.rows.ts';
import { dedent, trimEdgeNewlines } from './u.text.ts';

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

  const title = ` ${dedent(`
    ${c.gray(`${c.green('system:tools')} `)}
  `)}`;
  console.info(`\n${title}\n${trimEdgeNewlines(table.toString())}\n`);

  if (args.help) {
    const cmd = 'deno run -A jsr:@sys/tools';
    const alias = `${c.italic(c.cyan('alias'))} ${c.white('sys')}=${c.yellow(`"${cmd}"`)}`;
    console.info(c.gray(`  shortcut: ${alias}\n`));
  }
}
