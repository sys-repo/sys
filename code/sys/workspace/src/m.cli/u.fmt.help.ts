import { Cli } from './common.ts';

const D = {
  tool: '@sys/workspace/cli',
} as const;

export const FmtHelp = {
  input(toolname: string = D.tool) {
    return {
      tool: toolname,
      summary: 'Upgrade workspace dependencies from canonical deps.yaml.',
      note: 'Interactive by default; non-interactive applies deterministically, and --dry-run previews without writing.',
      usage: [`${toolname} [options]`],
      options: [
        ['-h, --help', 'show help'],
        ['--non-interactive', 'run without prompts'],
        ['--policy <none|patch|minor|latest>', 'set the upgrade policy'],
        ['--dry-run', 'render the upgrade result without writing files'],
        ['--prerelease', 'include prerelease versions in planning'],
        ['--deps <path>', 'override the deps.yaml path'],
        ['--include <name[,name]>', 'limit the run to named dependencies'],
        ['--exclude <name[,name]>', 'exclude named dependencies from the run'],
      ] as const,
      examples: [
        `${toolname}`,
        `${toolname} --non-interactive`,
        `${toolname} --non-interactive --policy latest`,
        `${toolname} --non-interactive --policy latest --prerelease`,
        `${toolname} --non-interactive --policy latest --dry-run`,
      ],
    } as const;
  },

  output(toolname: string = D.tool): string {
    return Cli.Fmt.Help.build(FmtHelp.input(toolname));
  },
} as const;
