import { CellHelp } from '../m.help/mod.ts';
import { Cli, Str, type t } from './common.ts';

const command = 'deno run -ER jsr:@sys/cell dsl';

export type DslHelpInput = {
  readonly path?: readonly string[];
  readonly toolname?: string;
  readonly format?: t.CellCli.Dsl.Format;
};

export const FmtDslHelp = {
  async output(input: DslHelpInput = {}): Promise<string> {
    const path = input.path ?? [];
    const format = input.format ?? 'human';
    const chapter = await CellHelp.Dsl.load(path);

    if (format === 'skill') return skill(chapter);

    const toolname = input.toolname ?? ['@sys/cell dsl', ...path].join(' ');
    return Cli.Fmt.Chapters.page({
      command,
      chapter,
      label: 'Chapter',
      help: {
        tool: toolname,
        summary: chapter.summary,
        sections: [
          {
            kind: 'lines',
            label: 'Usage',
            items: [`${command} [chapter...] [--format <format>]`],
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

function skill(chapter: t.CellHelp.Dsl.Chapter): string {
  return Cli.Fmt.Chapters.markdown({
    command,
    commandSuffix: '--format skill',
    chapter,
    frontmatter: {
      name: skillName(chapter),
      description: skillDescription(chapter),
    },
  });
}

function skillName(chapter: t.CellHelp.Dsl.Chapter): string {
  return ['sys-cell-dsl', ...chapter.path].join('-');
}

function skillDescription(chapter: t.CellHelp.Dsl.Chapter): string {
  if (chapter.path.length === 0) {
    return 'Guides Cell DSL speech acts, owner rules, mappings, and chapters; use when changing a Cell folder.';
  }

  const summary = Str.trimEdgeNewlines(chapter.summary)
    .replaceAll('`', '')
    .replace(/\.$/, '')
    .split(/\s+/)
    .join(' ');
  return `Guides valid Cell folder edits; use when you need to ${lowerFirst(summary)}.`;
}

function lowerFirst(input: string): string {
  return input ? `${input[0].toLocaleLowerCase()}${input.slice(1)}` : input;
}
