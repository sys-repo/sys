import { ServerHelp } from '../m.help/mod.ts';
import { Fmt, Str, type t } from './common.ts';

const command = 'deno run -ER jsr:@sys/server dsl';

export type DslHelpInput = {
  readonly path?: readonly string[];
  readonly toolname?: string;
  readonly format?: t.ServerCli.Dsl.Format;
};

export const FmtDslHelp = Object.freeze(
  {
    async output(input: DslHelpInput = {}): Promise<string> {
      const path = input.path ?? [];
      const format = input.format ?? 'human';
      const chapter = await ServerHelp.Dsl.load(path);

      if (format === 'skill') return skill(chapter);

      const toolname = input.toolname ?? ['@sys/server dsl', ...path].join(' ');
      return Fmt.Chapters.page({
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
  } as const,
);

function skill(chapter: t.ServerHelp.Dsl.Chapter): string {
  return Fmt.Chapters.markdown({
    command,
    commandSuffix: '--format skill',
    chapter,
    frontmatter: {
      name: skillName(chapter),
      description: skillDescription(chapter),
    },
  });
}

function skillName(chapter: t.ServerHelp.Dsl.Chapter): string {
  const path = chapter.path.map((part) => part.replaceAll('.', '-'));
  return ['sys-server-dsl', ...path].join('-');
}

function skillDescription(chapter: t.ServerHelp.Dsl.Chapter): string {
  if (chapter.path.length === 0) {
    return 'Guides @sys/server primitive boundaries, WebSocketServer, Cmd transport, lifecycle, and service contracts; use before using, changing, or composing @sys/server primitives.';
  }

  const summary = Str.trimEdgeNewlines(chapter.summary)
    .replaceAll('`', '')
    .replace(/\.$/, '')
    .split(/\s+/)
    .join(' ');
  return `Guides @sys/server primitives; use when you need to ${lowerFirst(summary)}.`;
}

function lowerFirst(input: string): string {
  return input ? `${input[0].toLocaleLowerCase()}${input.slice(1)}` : input;
}
