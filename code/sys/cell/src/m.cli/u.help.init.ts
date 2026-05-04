import { CellHelp } from '../m.help/mod.ts';
import { CliFmt } from './common.ts';

export const FmtInitHelp = {
  async input(toolname = '@sys/cell/cli init') {
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

  async output(toolname?: string): Promise<string> {
    return CliFmt.Help.build(await FmtInitHelp.input(toolname));
  },
} as const;
