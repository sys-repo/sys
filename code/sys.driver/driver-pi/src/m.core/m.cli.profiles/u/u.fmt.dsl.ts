import { PiHelp } from '../../m.help/mod.ts';
import { Cli, Str, type t } from '../common.ts';

const command = 'deno run -ER jsr:@sys/driver-pi dsl';

type DslFormat = 'human' | 'skill';

type DslArgs = {
  readonly path: readonly string[];
  readonly format: DslFormat;
};

export const ProfilesDslFmt = {
  async output(argv: readonly string[] = []): Promise<string> {
    const args = parse(argv);
    const chapter = await PiHelp.Dsl.load(args.path);

    if (args.format === 'skill') return skill(chapter);

    const toolname = ['@sys/driver-pi dsl', ...args.path].join(' ');
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

/**
 * Helpers:
 */

function parse(argv: readonly string[]): DslArgs {
  const path: string[] = [];
  let format: DslFormat | undefined;

  // Cursor loop preserves option/value paired consumption for --format.
  for (let cursor = 0; cursor < argv.length; cursor += 1) {
    const token = argv[cursor];

    if (token === '-h' || token === '--help') continue;

    if (token === '--format') {
      if (format !== undefined) throw new Error('Repeated option for dsl: --format');
      const value = argv[cursor + 1];
      if (value === undefined || value.startsWith('-')) {
        throw new Error('Option requires a value: --format');
      }
      format = dslFormat(value);
      cursor += 1;
      continue;
    }

    if (token.startsWith('--format=')) {
      if (format !== undefined) throw new Error('Repeated option for dsl: --format');
      format = dslFormat(token.slice('--format='.length));
      continue;
    }

    if (token.startsWith('-')) throw new Error(`Unexpected flag for dsl: ${token}`);

    path.push(token);
  }

  return { path, format: format ?? 'human' };
}

function dslFormat(value: string): DslFormat {
  if (value === 'human' || value === 'skill') return value;
  throw new Error(`Unsupported dsl format: ${value} (expected: human, skill)`);
}

function skill(chapter: t.PiHelp.Dsl.Chapter): string {
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

function skillName(chapter: t.PiHelp.Dsl.Chapter): string {
  return ['sys-driver-pi-dsl', ...chapter.path].join('-');
}

function skillDescription(chapter: t.PiHelp.Dsl.Chapter): string {
  if (chapter.path.length === 0) {
    return 'Guides Pi-Driver profile, tools, extension policy, restart semantics, and live tool callability; use before editing Pi-Driver policy.';
  }

  const summary = Str.trimEdgeNewlines(chapter.summary)
    .replaceAll('`', '')
    .replace(/\.$/, '')
    .split(/\s+/)
    .join(' ');
  return `Guides Pi-Driver policy work; use when you need to ${lowerFirst(summary)}.`;
}

function lowerFirst(input: string): string {
  return input ? `${input[0].toLocaleLowerCase()}${input.slice(1)}` : input;
}
