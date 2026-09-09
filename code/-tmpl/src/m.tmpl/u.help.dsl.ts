import { TmplHelp } from '../m.help/mod.ts';
import { Cli, Str, type t } from './common.ts';

const command = 'deno run -ERW jsr:@sys/tmpl dsl';

export type DslHelpInput = {
  readonly path?: readonly string[];
  readonly toolname?: string;
  readonly format?: t.TmplCli.Dsl.Format;
};

export const FmtDslHelp = {
  async output(input: DslHelpInput = {}): Promise<string> {
    const path = input.path ?? [];
    const format = input.format ?? 'human';
    const chapter = await TmplHelp.Dsl.load(path);

    if (format === 'skill') return skill(chapter);

    const toolname = input.toolname ?? ['@sys/tmpl dsl', ...path].join(' ');
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

function skill(chapter: t.TmplHelp.Dsl.Chapter): string {
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

function skillName(chapter: t.TmplHelp.Dsl.Chapter): string {
  const path = chapter.path.map((part) => part.replaceAll('.', '-'));
  return ['sys-tmpl-dsl', ...path].join('-');
}

function skillDescription(chapter: t.TmplHelp.Dsl.Chapter): string {
  if (chapter.path.length === 0) {
    return 'Guides @sys/tmpl reading protocol, scaffold speech acts, template selection, slots, side effects, and verification; use when you are about to scaffold with @sys/tmpl.';
  }

  const summary = Str.trimEdgeNewlines(chapter.summary)
    .replaceAll('`', '')
    .replace(/\.$/, '')
    .split(/\s+/)
    .join(' ');
  return `Guides @sys/tmpl scaffolding; use when you need to ${lowerFirst(summary)}.`;
}

function lowerFirst(input: string): string {
  return input ? `${input[0].toLocaleLowerCase()}${input.slice(1)}` : input;
}
