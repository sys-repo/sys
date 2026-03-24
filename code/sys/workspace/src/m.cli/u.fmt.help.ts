import { Cli, Str, c } from './common.ts';

type HelpRow = {
  readonly flag: string;
  readonly description: string;
};

const D = {
  tool: '@sys/workspace/cli',
} as const;

export const FmtHelp = {
  output(toolname: string = D.tool): string {
    const str = Str.builder();

    str
      .line(c.bold(c.brightCyan(toolname)))
      .line()
      .line(c.white('Upgrade workspace dependencies from canonical deps.yaml.'))
      .line(c.gray('Interactive by default; non-interactive for reporting or scripted apply.'))
      .line()
      .line(FmtHelp.usage(toolname))
      .line()
      .line(FmtHelp.options())
      .line()
      .line(FmtHelp.examples(toolname));

    return Str.trimEdgeNewlines(String(str));
  },

  usage(toolname: string): string {
    const table = Cli.table([]);
    table.push([c.gray('Usage'), c.white(`${toolname} [options]`)]);
    return Str.trimEdgeNewlines(String(table));
  },

  options(): string {
    const table = Cli.table([]);
    const rows: readonly HelpRow[] = [
      { flag: '-h, --help', description: 'show help' },
      { flag: '--non-interactive', description: 'plan or apply without prompts' },
      { flag: '--apply', description: 'write deps.yaml and projected files' },
      { flag: '--mode <none|patch|minor|latest>', description: 'set the upgrade policy mode' },
      { flag: '--prerelease', description: 'include prerelease versions in planning' },
      { flag: '--deps <path>', description: 'override the deps.yaml path' },
      { flag: '--include <name[,name]>', description: 'limit the run to named dependencies' },
      { flag: '--exclude <name[,name]>', description: 'exclude named dependencies from the run' },
    ];

    table.push([c.gray('Options'), '']);
    for (const row of rows) {
      table.push([c.gray(`  ${row.flag}`), row.description]);
    }
    return Str.trimEdgeNewlines(String(table));
  },

  examples(toolname: string): string {
    const str = Str.builder();
    str
      .line(c.gray('Examples'))
      .line(c.gray(`  ${toolname}`))
      .line(c.gray(`  ${toolname} --non-interactive`))
      .line(c.gray(`  ${toolname} --non-interactive --apply --mode latest`))
      .line(c.gray(`  ${toolname} --non-interactive --apply --mode latest --prerelease`));
    return Str.trimEdgeNewlines(String(str));
  },
} as const;
