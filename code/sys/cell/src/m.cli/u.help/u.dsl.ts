import { CellHelp } from '../../m.help/mod.ts';
import { Fmt, Str, type t } from '../common.ts';

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
    return Fmt.Chapters.page({
      command,
      chapter: await highlightedYaml(chapter),
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

async function highlightedYaml(chapter: t.CellHelp.Dsl.Chapter): Promise<t.CellHelp.Dsl.Chapter> {
  const sections = await Promise.all(chapter.sections.map(highlightYamlSection));
  return { ...chapter, sections };
}

async function highlightYamlSection(
  section: t.CellHelp.Section,
): Promise<t.CellHelp.Section> {
  if (section.label !== 'Descriptor patch') return section;

  const items = await Promise.all(
    section.items.map((item) => Fmt.Code.highlight(item, { lang: 'yaml' })),
  );
  return { ...section, items };
}

function skill(chapter: t.CellHelp.Dsl.Chapter): string {
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

function skillName(chapter: t.CellHelp.Dsl.Chapter): string {
  return ['sys-cell-dsl', ...chapter.path].join('-');
}

function skillDescription(chapter: t.CellHelp.Dsl.Chapter): string {
  if (chapter.path.length === 0) {
    return 'Guides Cell DSL reading protocol, speech acts, owner rules, mappings, and chapters; use when you are about to change a Cell folder.';
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
