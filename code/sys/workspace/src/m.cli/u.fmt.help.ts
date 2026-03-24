import { Cli } from './common.ts';

const D = {
  tool: '@sys/workspace/cli',
} as const;

export const FmtHelp = {
  input(toolname: string = D.tool) {
    return {
      tool: toolname,
      summary: 'Upgrade workspace dependencies from canonical deps.yaml.',
      note: 'Interactive by default; non-interactive for reporting or scripted apply.',
      usage: [`${toolname} [options]`],
      options: [
        ['-h, --help', 'show help'],
        ['--non-interactive', 'plan or apply without prompts'],
        ['--apply', 'write deps.yaml and projected files'],
        ['--mode <none|patch|minor|latest>', 'set the upgrade policy mode'],
        ['--prerelease', 'include prerelease versions in planning'],
        ['--deps <path>', 'override the deps.yaml path'],
        ['--include <name[,name]>', 'limit the run to named dependencies'],
        ['--exclude <name[,name]>', 'exclude named dependencies from the run'],
      ] as const,
      examples: [
        `${toolname}`,
        `${toolname} --non-interactive`,
        `${toolname} --non-interactive --apply --mode latest`,
        `${toolname} --non-interactive --apply --mode latest --prerelease`,
      ],
    } as const;
  },

  output(toolname: string = D.tool): string {
    return Cli.Fmt.Help.build(FmtHelp.input(toolname));
  },
} as const;
