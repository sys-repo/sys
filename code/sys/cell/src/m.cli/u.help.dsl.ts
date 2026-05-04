import { CellHelp } from '../m.help/mod.ts';
import { c, CliFmt, CliTable, Str } from './common.ts';

type HelpSection = {
  readonly label: string;
  readonly items: readonly string[];
};

export const FmtDslHelp = {
  async output(toolname = '@sys/cell/cli dsl'): Promise<string> {
    const guidance = await CellHelp.Dsl.load();
    const help = CliFmt.Help.build({ tool: toolname, summary: guidance.intro });

    return `${help}\n\n${guideTable([
      { label: 'Rule', items: guidance.rule },
      { label: 'Speech acts', items: guidance.speechActs },
      { label: 'Owners', items: guidance.owners },
      { label: 'Mappings', items: guidance.mappings },
    ])}`;
  },
} as const;

/**
 * Helpers:
 */

function guideTable(sections: readonly HelpSection[]): string {
  const table = CliTable.create([]);

  sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) table.push(['', '']);
    section.items.forEach((item, itemIndex) => {
      table.push([itemIndex === 0 ? c.gray(section.label) : '', c.white(item)]);
    });
  });

  return Str.trimEdgeNewlines(String(table));
}
