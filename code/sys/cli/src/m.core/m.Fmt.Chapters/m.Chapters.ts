import { c, Str, stripAnsi, type t } from '../common.ts';
import { Help } from '../m.Fmt/m.Fmt.Help.ts';
import { Book } from './m.Book.ts';
import { Resources } from './m.Resources.ts';
import { files, resolve } from './u.resources.ts';
import { hr } from '../m.Fmt/m.Fmt.Hr.ts';
import { Table } from '../m.Table/mod.ts';

const TERMINAL_TEXT_WIDTH = 100;
const HANGING_INDENT = 2;
const MARKDOWN_WIDTH = 80;

type WrapTextOptions = {
  readonly continuationIndent?: number;
};

type WrapLineOptions = {
  readonly indent?: number;
  readonly continuationIndent?: number;
};

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
  const label = input.label ?? 'Chapter';
  const rowWidth = Math.max(0, TERMINAL_TEXT_WIDTH);

  chapter.sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) table.push(['', '']);
    section.items.forEach((item, itemIndex) => {
      table.push([
        itemIndex === 0 ? c.gray(section.label) : '',
        c.white(wrapText(item, rowWidth, { continuationIndent: HANGING_INDENT })),
      ]);
    });
  });

  if (chapter.chapters.length > 0) {
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
    : [help, hr({ color: 'cyan' }), chapter];
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
    lines.push('', `## ${section.label}`, '', ...markdownSectionItems(section.items));
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
  const summary = c.gray(wrapText(chapter.summary, rowWidth));
  const inline = `${padVisibleEnd(command, commandWidth)}  ${summary}`;
  if (visibleWidth(inline) <= rowWidth) return inline;

  const splitSummary = c.gray(
    indentText(
      wrapText(chapter.summary, rowWidth - HANGING_INDENT),
      HANGING_INDENT,
    ),
  );
  return `${command}\n${splitSummary}`;
}

function chapterCommand(
  input: t.CliFormatChapters.FormatInput,
  chapter: t.CliFormatChapters.Chapter.Link,
): string {
  const prefix = c.dim(c.cyan(input.command));
  const path = chapter.path.join(' ');
  return path ? `${prefix} ${c.cyan(path)}` : prefix;
}

function markdownSectionItems(items: readonly string[]): readonly string[] {
  return items.flatMap((item) => wrapText(item, MARKDOWN_WIDTH).split('\n'));
}

function markdownChapterLine(
  input: t.CliFormatChapters.MarkdownInput,
  chapter: t.CliFormatChapters.Chapter.Link,
): string {
  const command = markdownChapterCommand(input, chapter);
  const summary = singleLine(chapter.summary);
  const inline = `- \`${command}\` — ${summary}`;
  return inline.length <= MARKDOWN_WIDTH ? inline : `- \`${command}\`\n  — ${summary}`;
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

function wrapText(input: string, width: number, options: WrapTextOptions = {}): string {
  if (width <= 0) return input;

  const continuationIndent = Math.max(0, options.continuationIndent ?? 0);
  const lines: string[] = [];
  let fenced = false;
  let fenceIndent = 0;

  Str.trimEdgeNewlines(input).split('\n').forEach((line) => {
    const fenceLine = line.trimStart().startsWith('```');

    if (fenced) {
      lines.push(prefixText(line, fenceIndent));
      if (fenceLine) fenced = false;
      return;
    }

    const indent = lines.length === 0 ? 0 : continuationIndent;
    if (fenceLine) {
      fenceIndent = indent;
      fenced = true;
      lines.push(prefixText(line, indent));
      return;
    }

    if (shouldPreserveLine(line)) {
      lines.push(prefixText(line, indent));
      return;
    }

    lines.push(...wrapLine(line, width, { indent, continuationIndent }));
  });

  return lines.join('\n');
}

function wrapLine(input: string, width: number, options: WrapLineOptions = {}): readonly string[] {
  const indent = Math.max(0, options.indent ?? 0);
  const continuationIndent = Math.max(0, options.continuationIndent ?? indent);
  const prefix = ' '.repeat(indent);

  if (visibleWidth(`${prefix}${input}`) <= width) return [`${prefix}${input}`];

  const leading = input.match(/^\s*/)?.[0] ?? '';
  const firstPrefix = `${prefix}${leading}`;
  const wrappedPrefix = `${' '.repeat(continuationIndent)}${leading}`;
  const words = input.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  let currentPrefix = firstPrefix;
  let available = Math.max(1, width - visibleWidth(currentPrefix));

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (visibleWidth(next) <= available || !line) {
      line = next;
    } else {
      lines.push(`${currentPrefix}${line}`);
      currentPrefix = wrappedPrefix;
      available = Math.max(1, width - visibleWidth(currentPrefix));
      line = word;
    }
  });

  if (line) lines.push(`${currentPrefix}${line}`);
  return lines;
}

function prefixText(input: string, width: number): string {
  return `${' '.repeat(Math.max(0, width))}${input}`;
}

function shouldPreserveLine(input: string): boolean {
  const text = input.trim();
  if (text.length === 0) return false;
  return (
    /^`.+`[.:;]?$/.test(text) ||
    /^\$\s+\S+/.test(text) ||
    /^deno\s+run\b/.test(text) ||
    /^https?:\/\/\S+$/.test(text)
  );
}

function indentText(input: string, width: number): string {
  const indent = ' '.repeat(Math.max(0, width));
  return input.split('\n').map((line) => `${indent}${line}`).join('\n');
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
