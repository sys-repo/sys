import { c, Str, stripAnsi, type t } from '../common.ts';
import { Help } from '../m.Fmt/m.Fmt.Help.ts';
import { Book } from './m.Book.ts';
import { Resources } from './m.Resources.ts';
import { files, resolve } from './u.resources.ts';
import { hr } from '../m.Fmt/m.Fmt.Hr.ts';
import { Table } from '../m.Table/mod.ts';

const MAX_WIDTH = 80;
const TABLE_GAP_WIDTH = 3;

/** Navigable help chapter formatting and tree helpers. */
export const Chapters: t.CliFormatChapters.Lib = {
  format,
  page,
  markdown,
  files,
  resolve,
  Book,
  Resources,
};

function format(input: t.CliFormatChapters.FormatInput): string {
  const { chapter } = input;
  const table = Table.create([]);

  chapter.sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) table.push(['', '']);
    section.items.forEach((item, itemIndex) => {
      table.push([itemIndex === 0 ? c.gray(section.label) : '', c.white(item)]);
    });
  });

  if (chapter.chapters.length > 0) {
    const label = input.label ?? 'Chapter';
    const labelWidth = maxVisibleWidth([
      ...chapter.sections.map((section) => section.label),
      label,
    ]);
    const rowWidth = Math.max(0, MAX_WIDTH - labelWidth - TABLE_GAP_WIDTH);

    if (chapter.sections.length > 0) table.push(['', '']);
    const commandWidth = maxVisibleWidth(
      chapter.chapters.map((item) => chapterCommand(input, item)),
    );
    chapter.chapters.forEach((item, itemIndex) => {
      table.push([
        itemIndex === 0 ? c.gray(label) : '',
        chapterLine(input, item, commandWidth, rowWidth),
      ]);
    });
  }

  return Str.trimEdgeNewlines(String(table));
}

function page(input: t.CliFormatChapters.PageInput): string {
  const help = Help.build(input.help);
  const chapter = format(input);
  const hasChapter = Str.trimEdgeNewlines(chapter).length > 0;
  const blocks = !hasChapter
    ? [help]
    : input.separator === false
    ? [help, chapter]
    : [help, hr('cyan'), chapter];
  return composeBlocks(blocks);
}

function markdown(input: t.CliFormatChapters.MarkdownInput): string {
  const { chapter } = input;
  const lines: string[] = [];
  const frontmatter = markdownFrontmatter(input.frontmatter);

  if (frontmatter.length > 0) {
    lines.push('---', ...frontmatter, '---', '');
  }

  lines.push(`# ${chapter.title}`, '', chapter.summary);

  chapter.sections.forEach((section) => {
    lines.push('', `## ${section.label}`, '', ...section.items);
  });

  if (chapter.chapters.length > 0) {
    lines.push('', `## ${input.label ?? 'Chapters'}`, '');
    chapter.chapters.forEach((item) => {
      lines.push(markdownChapterLine(input, item));
    });
  }

  return Str.trimEdgeNewlines(lines.join('\n'));
}

function chapterLine(
  input: t.CliFormatChapters.FormatInput,
  chapter: t.CliFormatChapters.Chapter.Link,
  commandWidth: number,
  rowWidth: number,
): string {
  const command = chapterCommand(input, chapter);
  const summary = c.gray(chapter.summary);
  const inline = `${padVisibleEnd(command, commandWidth)}  ${summary}`;
  return visibleWidth(inline) <= rowWidth ? inline : `${command}\n${summary}`;
}

function chapterCommand(
  input: t.CliFormatChapters.FormatInput,
  chapter: t.CliFormatChapters.Chapter.Link,
): string {
  const prefix = c.dim(c.cyan(input.command));
  const path = chapter.path.join(' ');
  return path ? `${prefix} ${c.cyan(path)}` : prefix;
}

function markdownChapterLine(
  input: t.CliFormatChapters.MarkdownInput,
  chapter: t.CliFormatChapters.Chapter.Link,
): string {
  const command = markdownChapterCommand(input, chapter);
  const summary = singleLine(chapter.summary);
  const inline = `- \`${command}\` — ${summary}`;
  return inline.length <= MAX_WIDTH ? inline : `- \`${command}\`\n  — ${summary}`;
}

function markdownChapterCommand(
  input: t.CliFormatChapters.MarkdownInput,
  chapter: t.CliFormatChapters.Chapter.Link,
): string {
  const path = chapter.path.join(' ');
  const suffix = input.commandSuffix?.trim();
  const command = path ? `${input.command} ${path}` : input.command;
  return suffix ? `${command} ${suffix}` : command;
}

function markdownFrontmatter(frontmatter?: t.CliFormatChapters.Frontmatter): readonly string[] {
  if (!frontmatter) return [];
  return Object.entries(frontmatter).map(([key, value]) => {
    return `${key}: "${yamlDoubleQuoted(value)}"`;
  });
}

function yamlDoubleQuoted(input: string): string {
  return input
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\r', '\\r')
    .replaceAll('\n', '\\n');
}

function singleLine(input: string): string {
  return Str.trimEdgeNewlines(input).split(/\s+/).join(' ');
}

function composeBlocks(blocks: readonly string[]): string {
  const body = blocks
    .map((block) => Str.trimEdgeNewlines(block))
    .filter((block) => block.length > 0)
    .join('\n\n');
  return `\n${body}\n`;
}

function visibleWidth(input: string): number {
  return stripAnsi(input).length;
}

function maxVisibleWidth(input: readonly string[]): number {
  return input.reduce((max, item) => Math.max(max, visibleWidth(item)), 0);
}

function padVisibleEnd(input: string, width: number): string {
  return `${input}${' '.repeat(Math.max(0, width - visibleWidth(input)))}`;
}
