import { CellHelp } from '../m.help/mod.ts';
import { c, CliFmt, CliTable, Str, stripAnsi, type t } from './common.ts';
import { composeHelpBlocks } from './u.help.compose.ts';

export type DslHelpInput = {
  readonly path?: readonly string[];
  readonly toolname?: string;
};

export const FmtDslHelp = {
  async output(input: DslHelpInput = {}): Promise<string> {
    const path = input.path ?? [];
    const chapter = await CellHelp.Dsl.load(path);
    const toolname = input.toolname ?? ['@sys/cell dsl', ...path].join(' ');
    const help = CliFmt.Help.build({ tool: toolname, summary: chapter.summary });
    const table = guideTable(chapter);

    return table ? composeHelpBlocks(help, table) : help;
  },
} as const;

/**
 * Helpers:
 */

function guideTable(chapter: t.CellHelp.Dsl.Chapter): string {
  const table = CliTable.create([]);

  if (chapter.chapters.length > 0) {
    const commandWidth = maxVisibleWidth(chapter.chapters.map(chapterCommand));
    chapter.chapters.forEach((item, itemIndex) => {
      table.push([itemIndex === 0 ? c.gray('Chapter') : '', chapterLine(item, commandWidth)]);
    });
    if (chapter.sections.length > 0) table.push(['', '']);
  }

  chapter.sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) table.push(['', '']);
    section.items.forEach((item, itemIndex) => {
      table.push([itemIndex === 0 ? c.gray(section.label) : '', c.white(item)]);
    });
  });

  return Str.trimEdgeNewlines(String(table));
}

function chapterLine(chapter: t.CellHelp.Dsl.ChapterLink, commandWidth: number): string {
  const command = chapterCommand(chapter);
  return `${padVisibleEnd(command, commandWidth)}  ${c.gray(`# ${chapter.summary}`)}`;
}

function chapterCommand(chapter: t.CellHelp.Dsl.ChapterLink): string {
  const prefix = c.dim(c.cyan('deno run jsr:@sys/cell dsl'));
  const name = c.cyan(chapter.path.join(' '));
  return `${prefix} ${name}`;
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
