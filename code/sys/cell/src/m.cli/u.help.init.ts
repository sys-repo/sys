import { CellHelp } from '../m.help/mod.ts';
import { c, CliFmt, CliTable, Str } from './common.ts';
import { Tmpl } from './u.tmpl.ts';

type OutputOptions = {
  readonly toolname?: string;
  readonly agent?: boolean;
};

export const FmtInitHelp = {
  async input(toolname = '@sys/cell init') {
    const guidance = await CellHelp.Init.load();
    return {
      tool: toolname,
      summary: guidance.summary,
      sections: [
        { kind: 'lines', label: 'Usage', items: guidance.usage },
        { kind: 'pairs', label: 'Options', items: guidance.options },
        { kind: 'lines', label: 'Safety', items: guidance.safety },
      ],
    } as const;
  },

  async output(options: OutputOptions = {}): Promise<string> {
    const help = CliFmt.Help.build(await FmtInitHelp.input(options.toolname));
    if (options.agent !== true) return help;

    const guidance = await CellHelp.Init.load();
    const descriptor = await Tmpl.minimalDescriptor();
    return `${help}\n\n${
      agentTable([
        { label: 'Agent', items: guidance.agent },
        { label: 'Writes', items: Tmpl.minimalWritePaths() },
        { label: 'Owns', items: Tmpl.minimalOwnedPaths() },
        {
          label: 'Descriptor',
          items: ['```yaml', ...block(descriptor).map((line) => line ? `  ${line}` : ''), '```'],
        },
      ])
    }`;
  },
} as const;

/**
 * Helpers:
 */

function block(text: string): readonly string[] {
  return Str.trimEdgeNewlines(text).split('\n');
}

function agentTable(sections: readonly { label: string; items: readonly string[] }[]): string {
  const table = CliTable.create([]);

  sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) table.push(['', '']);
    section.items.forEach((item, itemIndex) => {
      table.push([itemIndex === 0 ? c.gray(section.label) : '', c.white(item)]);
    });
  });

  return Str.trimEdgeNewlines(String(table));
}
