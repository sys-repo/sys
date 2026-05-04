import { CellHelp } from '../m.help/mod.ts';
import { c, CliFmt, CliTable, Str } from './common.ts';
import { Tmpl } from './u.tmpl.ts';

type HelpSection = {
  readonly label: string;
  readonly items: readonly string[];
};

export const FmtAgentHelp = {
  async output(toolname = '@sys/cell/cli help agent'): Promise<string> {
    const guidance = await CellHelp.Agent.load();
    const descriptor = await Tmpl.minimalDescriptor();
    const gitignore = Tmpl.gitignore();

    const help = CliFmt.Help.build({ tool: toolname, summary: guidance.intro });
    return `${help}\n\n${guideTable([
      { label: 'Init', items: guidance.init },
      { label: 'Writes', items: Tmpl.minimalWritePaths() },
      { label: 'Owns', items: Tmpl.minimalOwnedPaths() },
      {
        label: 'Safety',
        items: [
          `${gitignore.path} may add ${gitignore.entries.join(', ')} once; never rewrite user rules.`,
        ],
      },
      { label: 'Preserve', items: guidance.preserve },
      { label: 'Rule', items: guidance.rule },
      { label: 'Speech acts', items: guidance.speechActs },
      { label: 'Owner flows', items: guidance.ownerFlows },
      { label: 'Act mapping', items: guidance.actMapping },
      {
        label: 'Descriptor',
        items: ['```yaml', ...block(descriptor).map((line) => `  ${line}`), '```'],
      },
    ])}`;
  },
} as const;

/**
 * Helpers:
 */

function block(text: string): readonly string[] {
  return Str.trimEdgeNewlines(text).split('\n');
}

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
