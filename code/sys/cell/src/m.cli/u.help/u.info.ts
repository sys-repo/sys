import { CellHelp } from '../../m.help/mod.ts';
import { Fmt } from '../common.ts';

export const FmtInfoHelp = {
  async input(toolname = '@sys/cell info') {
    const guidance = await CellHelp.Info.load();
    return {
      tool: toolname,
      summary: guidance.summary,
      sections: [
        { kind: 'lines', label: 'Usage', items: guidance.usage },
        { kind: 'pairs', label: 'Options', items: guidance.options },
        { kind: 'lines', label: 'Reads', items: guidance.reads },
      ],
    } as const;
  },

  async output(toolname?: string): Promise<string> {
    return Fmt.Help.build(await FmtInfoHelp.input(toolname));
  },
} as const;
