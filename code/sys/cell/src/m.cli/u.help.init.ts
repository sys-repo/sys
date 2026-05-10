import { CellHelp } from '../m.help/mod.ts';
import { c, CliTable, Fmt, Str } from './common.ts';
import { composeHelpBlocks } from './u.help.compose.ts';
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
    const help = Fmt.Help.build(await FmtInitHelp.input(options.toolname));
    if (options.agent !== true) return help;

    const guidance = await CellHelp.Init.load();
    const descriptor = await Tmpl.minimalDescriptor();
    const agent = composeHelpBlocks(
      agentTable([
        { label: 'Agent', items: guidance.agent },
        { label: 'Writes', items: Tmpl.minimalWritePaths() },
        { label: 'Owns', items: Tmpl.minimalOwnedPaths() },
      ]),
      descriptorBlock(descriptor),
    );
    return composeHelpBlocks(help, agent);
  },
} as const;

/**
 * Helpers:
 */

function descriptorBlock(descriptor: string): string {
  return [c.gray('Descriptor'), Fmt.Code.block(descriptor, { indent: 2 })].join('\n');
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
