import { Args, Cli, Fs, Str, type t } from '../common.ts';
import { Help } from '../m.help/mod.ts';

const command = 'deno run -A jsr:@sys/tools dsl';

type DslFormat = 'human' | 'skill';

type ParsedArgs = {
  readonly help: boolean;
  readonly format?: string | boolean | readonly (string | boolean)[];
  readonly _: readonly string[];
};

export type DslHelpInput = {
  readonly path?: readonly string[];
  readonly toolname?: string;
  readonly format?: DslFormat;
};

export async function cli(_cwd: t.StringDir, argv: readonly string[]) {
  const args = parseArgs(argv);
  const format = parseFormat(args.format);
  const text = await FmtDslHelp.output({ path: args._, format });
  console.info(text);
}

export const FmtDslHelp = {
  async output(input: DslHelpInput = {}): Promise<string> {
    const path = input.path ?? [];
    const format = input.format ?? 'human';
    const chapter = await Help.Dsl.load(path);

    if (format === 'skill') return skill(chapter);

    const toolname = input.toolname ?? ['@sys/tools dsl', ...path].join(' ');
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

function parseArgs(argv: readonly string[]): ParsedArgs {
  const args = Args.parse<{
    readonly help?: boolean;
    readonly format?: string | boolean | readonly (string | boolean)[];
  }>([...argv], {
    boolean: ['help'],
    string: ['format'],
    alias: { h: 'help' },
  });

  return {
    help: args.help ?? false,
    format: args.format,
    _: args._,
  };
}

function parseFormat(input: ParsedArgs['format']): DslFormat {
  if (input === undefined || input === false) return 'human';
  if (input === 'human' || input === 'skill') return input;
  throw new Error(`Unsupported dsl format: ${String(input)} (expected: human, skill)`);
}

function skill(chapter: t.Help.Dsl.Chapter): string {
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

function skillName(chapter: t.Help.Dsl.Chapter): string {
  const path = chapter.path.map((part) => part.replaceAll('.', '-'));
  return ['sys-tools-dsl', ...path].join('-');
}

function skillDescription(chapter: t.Help.Dsl.Chapter): string {
  if (chapter.path.length === 0) {
    return 'Guides @sys/tools DSL reading protocol, root ownership, chapter policy, and tool-owner boundaries; use when you are about to change @sys/tools guidance or behavior.';
  }

  const summary = Str.trimEdgeNewlines(chapter.summary)
    .replaceAll('`', '')
    .replace(/\.$/, '')
    .split(/\s+/)
    .join(' ');
  return `Guides @sys/tools DSL work; use when you need to ${lowerFirst(summary)}.`;
}

function lowerFirst(input: string): string {
  return input ? `${input[0].toLocaleLowerCase()}${input.slice(1)}` : input;
}

if (import.meta.main) {
  await cli(Fs.cwd('terminal'), Deno.args);
}
