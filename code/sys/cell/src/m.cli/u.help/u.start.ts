import { CellHelp } from '../../m.help/mod.ts';
import { Fmt } from '../common.ts';

export const FmtStartHelp = {
  async input(toolname = '@sys/cell start') {
    const guidance = await CellHelp.Start.load();
    return {
      tool: toolname,
      summary: guidance.summary,
      sections: [
        { kind: 'lines', label: 'Usage', items: guidance.usage },
        { kind: 'pairs', label: 'Options', items: guidance.options },
        { kind: 'lines', label: 'Services', items: guidance.services },
      ],
    } as const;
  },

  async output(toolname?: string): Promise<string> {
    return Fmt.Help.build(await FmtStartHelp.input(toolname));
  },
} as const;
