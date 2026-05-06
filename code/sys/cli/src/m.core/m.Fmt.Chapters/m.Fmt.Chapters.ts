import { c, Str, stripAnsi, type t } from '../common.ts';
import { Table } from '../m.Table/mod.ts';

/** Navigable help chapter formatting and tree helpers. */
export const Chapters: t.CliFormatChapters.Lib = {
  format,
  files,
  resolve,
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
    if (chapter.sections.length > 0) table.push(['', '']);
    const commandWidth = maxVisibleWidth(
      chapter.chapters.map((item) => chapterCommand(input, item)),
    );
    chapter.chapters.forEach((item, itemIndex) => {
      table.push([
        itemIndex === 0 ? c.gray(input.label ?? 'Chapter') : '',
        chapterLine(input, item, commandWidth),
      ]);
    });
  }

  return Str.trimEdgeNewlines(String(table));
}

function files<TFile extends string>(
  chapter: t.CliFormatChapters.Chapter.Resource<TFile>,
): readonly TFile[] {
  return [chapter.file, ...chapter.children.flatMap(files)];
}

function resolve<TFile extends string>(
  root: t.CliFormatChapters.Chapter.Resource<TFile>,
  path: readonly string[],
): t.CliFormatChapters.Chapter.Resource<TFile> | undefined {
  let resource = root;

  for (const id of path) {
    const child = resource.children.find((item) => item.id === id);
    if (!child) return undefined;
    resource = child;
  }

  return resource;
}

function chapterLine(
  input: t.CliFormatChapters.FormatInput,
  chapter: t.CliFormatChapters.Chapter.Link,
  commandWidth: number,
): string {
  const command = chapterCommand(input, chapter);
  return `${padVisibleEnd(command, commandWidth)}  ${c.gray(`# ${chapter.summary}`)}`;
}

function chapterCommand(
  input: t.CliFormatChapters.FormatInput,
  chapter: t.CliFormatChapters.Chapter.Link,
): string {
  const prefix = c.dim(c.cyan(input.command));
  const path = chapter.path.join(' ');
  return path ? `${prefix} ${c.cyan(path)}` : prefix;
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
