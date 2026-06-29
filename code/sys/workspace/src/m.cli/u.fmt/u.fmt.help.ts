import { WorkspaceHelp } from '../../m.help/mod.ts';
import { Cli, Str, type t } from '../common.ts';

const D = {
  tool: '@sys/workspace',
  dslCommand: 'deno run -ER jsr:@sys/workspace dsl',
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
      summary: 'Workspace dependency and package-version tooling.',
      note: 'Use a command for DSL guidance, package bumps, or dependency upgrades.',
      sections: [
        { kind: 'lines', label: 'Usage', items: [`${toolname} [command] [options]`] },
        {
          kind: 'pairs',
          label: 'Commands',
          items: [
            ['dsl', 'show workspace DSL guidance'],
            ['bump', 'bump workspace package versions'],
            ['upgrade', 'upgrade workspace dependencies from deps.yaml'],
          ],
        },
        {
          kind: 'pairs',
          label: 'Options',
          items: [['-h, --help', 'show help']],
        },
        {
          kind: 'lines',
          label: 'Examples',
          tone: 'muted',
          items: [
            'deno run -ER   jsr:@sys/workspace dsl',
            'deno run -ER   jsr:@sys/workspace dsl delta --format skill',
            'deno run -ERW  jsr:@sys/workspace bump --help',
            'deno run -ERWN jsr:@sys/workspace upgrade --help',
          ],
        },
      ],
    } as const;
  },

  output(toolname: string = D.tool): string {
    return Cli.Fmt.Help.build(FmtHelp.input(toolname));
  },

  upgradeInput(toolname: string = `${D.tool} upgrade`) {
    return {
      tool: toolname,
      summary: 'Upgrade workspace dependencies from canonical deps.yaml.',
      note: 'Interactive by default; use --dry-run to preview without writing.',
      usage: [`${toolname} [options]`],
      options: [
        ['-h, --help', 'show help'],
        ['--non-interactive', 'run without prompts'],
        ['--policy <none|patch|minor|latest>', 'set the upgrade policy'],
        ['--minimum-dependency-age <age>', 'minimum age (0 disables)'],
        ['--dry-run', 'preview result without writing'],
        ['--prerelease', 'include prerelease versions'],
        ['--deps <path>', 'override deps.yaml path'],
        ['--include <name[,name]>', 'limit run to named deps'],
        ['--exclude <name[,name]>', 'exclude named deps'],
      ] as const,
      examples: [
        `${toolname}`,
        `${toolname} --non-interactive`,
        `${toolname} --non-interactive --policy latest`,
        `${toolname} --minimum-dependency-age P2D`,
        `${toolname} --minimum-dependency-age 0`,
        `${toolname} --non-interactive --policy latest --prerelease`,
        `${toolname} --non-interactive --policy latest --dry-run`,
      ],
    } as const;
  },

  upgradeOutput(toolname?: string): string {
    return Cli.Fmt.Help.build(FmtHelp.upgradeInput(toolname));
  },

  async dslOutput(input: DslHelpInput = {}): Promise<string> {
    const path = input.path ?? [];
    const format = input.format ?? 'human';
    const chapter = await WorkspaceHelp.Dsl.load(path);

    if (format === 'skill') return skill(chapter);

    const toolname = input.toolname ?? ['@sys/workspace dsl', ...path].join(' ');
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
    return 'Use before @sys/workspace graph, delta, or bump edits.';
  }

  const summary = Str.trimEdgeNewlines(chapter.summary)
    .replaceAll('`', '')
    .replace(/\.$/, '')
    .split(/\s+/)
    .join(' ');
  return `Use for @sys/workspace: ${lowerFirst(summary)}.`;
}

function lowerFirst(input: string): string {
  return input ? `${input[0].toLocaleLowerCase()}${input.slice(1)}` : input;
}
