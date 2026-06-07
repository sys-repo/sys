import { c, Str, type t } from '../common.ts';
import { Help } from '../m.Fmt/m.Fmt.Help.ts';
import { hr } from '../m.Fmt/m.Fmt.Hr.ts';
import { Text } from '../m.Fmt.Text/mod.ts';
import { Book } from './m.Book.ts';
import { Resources } from './m.Resources.ts';
import { files, resolve } from './u.resources.ts';

const DEFAULT_PAGE_WIDTH = 128;
const DEFAULT_MIN_BODY_WIDTH = 24;
const GAP = '   ';
const HANGING_INDENT = 2;
const MARKDOWN_WIDTH = 80;

type Layout = {
  readonly gap: string;
  readonly labelWidth: number;
  readonly pageWidth: number;
  readonly bodyWidth: number;
  readonly stacked: boolean;
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
  const childLabel = input.label ?? Str.plural(chapter.chapters.length, 'Chapter');
  const layout = resolveLayout(input);
  const lines: string[] = [];

  chapter.sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) lines.push('');
    section.items.forEach((item, itemIndex) => {
      lines.push(...sectionItemLines(itemIndex === 0 ? section.label : '', item, layout));
    });
  });

  if (chapter.chapters.length > 0) {
    if (chapter.sections.length > 0) lines.push('');
    const commandWidth = Text.maxVisibleWidth(
      chapter.chapters.map((item) => chapterCommand(input, item)),
    );
    const inlineLinks = !layout.stacked && chapter.chapters.every((item) => {
      const command = chapterCommand(input, item);
      const inline = `${Text.padEnd(command, commandWidth)}  ${c.gray(item.summary)}`;
      return Text.visibleWidth(inline) <= layout.bodyWidth;
    });
    chapter.chapters.forEach((item, itemIndex) => {
      lines.push(
        ...chapterLinkLines(
          itemIndex === 0 ? childLabel : '',
          input,
          item,
          commandWidth,
          inlineLinks,
          layout,
        ),
      );
    });
  }

  return Str.trimEdgeNewlines(lines.join('\n'));
}

function page(input: t.CliFormatChapters.PageInput): string {
  const helpInput = input.layout && !input.help.layout
    ? { ...input.help, layout: input.layout }
    : input.help;
  const help = Help.build(helpInput);
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

function sectionItemLines(label: string, item: string, layout: Layout): readonly string[] {
  if (layout.stacked) return stackedLines(label, item, layout);

  const labelText = label
    ? c.gray(Text.padEnd(label, layout.labelWidth))
    : ' '.repeat(layout.labelWidth);
  const wrapped = Text.wrapLines(item, {
    width: layout.bodyWidth,
    continuationIndent: HANGING_INDENT,
  });

  return wrapped.map((line, index) => {
    if (line.length === 0) return '';
    const left = index === 0 ? labelText : ' '.repeat(layout.labelWidth);
    return `${left}${layout.gap}${c.white(line)}`;
  });
}

function chapterLinkLines(
  label: string,
  input: t.CliFormatChapters.FormatInput,
  chapter: t.CliFormatChapters.Chapter.Link,
  commandWidth: number,
  inline: boolean,
  layout: Layout,
): readonly string[] {
  if (layout.stacked) {
    return stackedLines(label, chapter.summary, layout, chapterCommand(input, chapter));
  }

  const labelText = label
    ? c.gray(Text.padEnd(label, layout.labelWidth))
    : ' '.repeat(layout.labelWidth);
  const blank = ' '.repeat(layout.labelWidth);
  const command = chapterCommand(input, chapter);
  if (inline) {
    return [
      `${labelText}${layout.gap}${Text.padEnd(command, commandWidth)}  ${c.gray(chapter.summary)}`,
    ];
  }

  const summary = Text.wrapLines(chapter.summary, {
    width: Math.max(0, layout.bodyWidth - HANGING_INDENT),
    indent: HANGING_INDENT,
    continuationIndent: HANGING_INDENT,
  }).map((line) => `${blank}${layout.gap}${c.gray(line)}`);

  return [`${labelText}${layout.gap}${command}`, ...summary];
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
  return items.flatMap((item) => Text.wrapLines(item, { width: MARKDOWN_WIDTH }));
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

function stackedLines(
  label: string,
  item: string,
  layout: Layout,
  prefix?: string,
): readonly string[] {
  const bodyWidth = layout.pageWidth;
  const lines: string[] = [];
  if (label) lines.push(c.gray(label));
  if (prefix) lines.push(...Text.wrapLines(prefix, { width: bodyWidth, indent: HANGING_INDENT }));
  lines.push(
    ...Text.wrapLines(item, {
      width: bodyWidth,
      indent: HANGING_INDENT,
      continuationIndent: HANGING_INDENT,
    }).map((line) => c.white(line)),
  );
  return lines;
}

function resolveLayout(input: t.CliFormatChapters.FormatInput): Layout {
  const labels = [
    ...input.chapter.sections
      .filter((section) => section.items.length > 0)
      .map((section) => section.label),
    ...(input.chapter.chapters.length > 0
      ? [input.label ?? Str.plural(input.chapter.chapters.length, 'Chapter')]
      : []),
  ];
  const options = input.layout ?? {};
  const pageWidth = Text.fitWidth({
    ...options,
    maxWidth: options.maxWidth ?? DEFAULT_PAGE_WIDTH,
    fallbackWidth: options.fallbackWidth ?? DEFAULT_PAGE_WIDTH,
  });
  const labelWidth = Text.maxVisibleWidth(labels);
  const minBodyWidth = Math.max(0, Math.floor(options.minBodyWidth ?? DEFAULT_MIN_BODY_WIDTH));
  const bodyWidth = Text.fitWidth({
    width: pageWidth,
    reserve: labelWidth + Text.visibleWidth(GAP),
    minWidth: minBodyWidth,
  });

  return {
    gap: GAP,
    labelWidth,
    pageWidth,
    bodyWidth,
    stacked: bodyWidth === 0,
  };
}

function composeBlocks(blocks: readonly string[]): string {
  const body = blocks
    .map((block) => Str.trimEdgeNewlines(block))
    .filter((block) => block.length > 0)
    .join('\n\n');
  return `\n${body}\n`;
}
