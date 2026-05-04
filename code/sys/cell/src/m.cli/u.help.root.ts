import { CellHelp } from '../m.help/mod.ts';
import { CliFmt } from './common.ts';

export const FmtRootHelp = {
  async input(toolname = '@sys/cell/cli') {
    const guidance = await CellHelp.Root.load();
    return {
      tool: toolname,
      summary: guidance.summary,
      sections: [
        { kind: 'lines', label: 'Usage', items: guidance.usage },
        { kind: 'pairs', label: 'Commands', items: guidance.commands },
        { kind: 'pairs', label: 'Options', items: guidance.options },
      ],
    } as const;
  },

  async output(toolname?: string): Promise<string> {
    return CliFmt.Help.build(await FmtRootHelp.input(toolname));
  },
} as const;
