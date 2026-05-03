import { c, Cli, Fmt, pkg, Str, type t } from './common.ts';
import { rootRows } from './u.rows.ts';
import { RootUpdateAdvisoryPolicy } from './u.updateAdvisory.policy.ts';

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

  const title = ` ${
    Str.dedent(`
    ${c.gray(`${c.green('system:tools')} `)}
  `)
  }`;
  console.info(`\n${title}\n${Str.trimEdgeNewlines(table.toString())}\n`);

  if (args.help) {
    const cmd = Fmt.invoke();
    const alias = `${c.italic(c.cyan('alias'))} ${c.white('sys')}=${c.yellow(`"${cmd}"`)}`;
    const op = c.white(RootUpdateAdvisoryPolicy.flag.noUpdateCheck);
    const env = c.white(`${RootUpdateAdvisoryPolicy.env.noUpdateCheck}=1`);
    console.info(c.gray(`  shortcut: ${alias}`));
    console.info(c.gray(`  option: ${op} Disable automatic update advisory checks and notices.`));
    console.info(c.gray(`  env: ${env} Same advisory opt-out for shell and CI.\n`));
  }
}
