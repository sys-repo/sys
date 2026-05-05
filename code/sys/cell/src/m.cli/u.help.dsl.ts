import { CellHelp } from '../m.help/mod.ts';
import { c, CliFmt, CliTable, Str, type t } from './common.ts';

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

    return table ? `${help}\n\n${table}` : help;
  },
} as const;

/**
 * Helpers:
 */

function guideTable(chapter: t.CellHelp.Dsl.Chapter): string {
  const table = CliTable.create([]);

  if (chapter.chapters.length > 0) {
    chapter.chapters.forEach((item, itemIndex) => {
      table.push([itemIndex === 0 ? c.gray('Chapter') : '', chapterLine(item)]);
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

function chapterLine(chapter: t.CellHelp.Dsl.ChapterLink): string {
  const prefix = c.dim(c.cyan('deno run jsr:@sys/cell dsl'));
  const name = c.cyan(chapter.path.join(' '));
  return `${prefix} ${name}   ${c.gray(`# ${chapter.summary}`)}`;
}
