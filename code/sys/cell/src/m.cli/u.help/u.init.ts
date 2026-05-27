import { CellHelp } from '../../m.help/mod.ts';
import { c, CliTable, Fmt, Str } from '../common.ts';
import { Tmpl } from '../u/u.tmpl.ts';
import { composeHelpBlocks } from './u.compose.ts';

type OutputOptions = {
  readonly toolname?: string;
  readonly agent?: boolean;
};

type AgentTableSection = {
  readonly label: string;
  readonly items: readonly string[];
  readonly style?: 'normal' | 'raw';
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
    const descriptor = await Fmt.Code.highlight(await Tmpl.minimalDescriptor(), { lang: 'yaml' });
    const agent = agentTable([
      { label: 'Agent', items: guidance.agent },
      { label: 'Writes', items: Tmpl.minimalWritePaths() },
      { label: 'Owns', items: Tmpl.minimalOwnedPaths() },
      { label: 'Descriptor', items: [descriptor], style: 'raw' },
    ]);
    return composeHelpBlocks(help, agent);
  },
} as const;

/**
 * Helpers:
 */

function agentTable(sections: readonly AgentTableSection[]): string {
  const table = CliTable.create([]);

  sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) table.push(['', '']);
    section.items.forEach((item, itemIndex) => {
      table.push([itemIndex === 0 ? c.gray(section.label) : '', tableItem(section, item)]);
    });
  });

  return Str.trimEdgeNewlines(String(table));
}

function tableItem(section: AgentTableSection, item: string): string {
  return section.style === 'raw' ? item : c.white(item);
}
