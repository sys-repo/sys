import { WorkspaceHelp } from '../../m.help/mod.ts';
import { Cli, Str, type t } from '../common.ts';

const D = {
  tool: '@sys/workspace/cli',
  dslCommand: 'deno run -ER jsr:@sys/workspace/cli dsl',
} as const;

export type DslHelpInput = {
  readonly path?: readonly string[];
  readonly toolname?: string;
  readonly format?: t.WorkspaceCli.Dsl.Format;
};

export const FmtHelp = {
  input(toolname: string = D.tool) {
    return {
      tool: toolname,
      summary: 'Upgrade workspace dependencies from canonical deps.yaml.',
      note:
        'Interactive by default; non-interactive applies deterministically, and --dry-run previews without writing.',
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
        `${toolname} dsl`,
      ],
    } as const;
  },

  output(toolname: string = D.tool): string {
    return Cli.Fmt.Help.build(FmtHelp.input(toolname));
  },

  async dslOutput(input: DslHelpInput = {}): Promise<string> {
    const path = input.path ?? [];
    const format = input.format ?? 'human';
    const chapter = await WorkspaceHelp.Dsl.load(path);

    if (format === 'skill') return skill(chapter);

    const toolname = input.toolname ?? ['@sys/workspace/cli dsl', ...path].join(' ');
    return Cli.Fmt.Chapters.page({
      command: D.dslCommand,
      chapter,
      label: 'Chapter',
      help: {
        tool: toolname,
        summary: chapter.summary,
        sections: [
          {
            kind: 'lines',
            label: 'Usage',
            items: [`${D.dslCommand} [chapter...] [--format <format>]`],
          },
          {
            kind: 'pairs',
            label: 'Options',
            items: [
              ['--format <format>', 'render output as human or skill'],
              ['-h, --help', 'show DSL help'],
            ],
          },
          {
            kind: 'pairs',
            label: 'Formats',
            items: [
              ['human', 'terminal help output (default)'],
              ['skill', 'agent-skill Markdown projection of the requested DSL chapter'],
            ],
          },
        ],
      },
    });
  },
} as const;

function skill(chapter: t.WorkspaceHelp.Dsl.Chapter): string {
  return Cli.Fmt.Chapters.markdown({
    command: D.dslCommand,
    commandSuffix: '--format skill',
    chapter,
    frontmatter: {
      name: skillName(chapter),
      description: skillDescription(chapter),
    },
  });
}

function skillName(chapter: t.WorkspaceHelp.Dsl.Chapter): string {
  return [
    'sys-workspace-dsl',
    ...chapter.path.map((part) => part.replaceAll('.', '-')),
  ].join('-');
}

function skillDescription(chapter: t.WorkspaceHelp.Dsl.Chapter): string {
  if (chapter.path.length === 0) {
    return [
      'Guides @sys/workspace graph, delta, and bump-since workflows;',
      'use before changing workspace planning or package version-bump guidance.',
    ].join(' ');
  }

  const summary = Str.trimEdgeNewlines(chapter.summary)
    .replaceAll('`', '')
    .replace(/\.$/, '')
    .split(/\s+/)
    .join(' ');
  return `Guides @sys/workspace workflows; use when you need to ${lowerFirst(summary)}.`;
}

function lowerFirst(input: string): string {
  return input ? `${input[0].toLocaleLowerCase()}${input.slice(1)}` : input;
}
