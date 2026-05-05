import { CellHelp } from '../m.help/mod.ts';
import type { CellHelp as TCellHelp } from '../m.help/t.ts';
import { c, CliFmt, CliTable, Str } from './common.ts';

export const FmtDslHelp = {
  async output(toolname = '@sys/cell/cli dsl'): Promise<string> {
    const guidance = await CellHelp.Dsl.load();
    const help = CliFmt.Help.build({ tool: toolname, summary: guidance.intro });

    return `${help}\n\n${guideTable(guidance.sections)}`;
  },
} as const;

/**
 * Helpers:
 */

function guideTable(sections: readonly TCellHelp.Section[]): string {
  const table = CliTable.create([]);

  sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) table.push(['', '']);
    section.items.forEach((item, itemIndex) => {
      table.push([itemIndex === 0 ? c.gray(section.label) : '', c.white(item)]);
    });
  });

  return Str.trimEdgeNewlines(String(table));
}
