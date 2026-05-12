import { CellHelp } from '../m.help/mod.ts';
import { Fmt } from './common.ts';

export const FmtActionHelp = {
  async input(toolname = '@sys/cell action') {
    const guidance = await CellHelp.Action.load();
    return {
      tool: toolname,
      summary: guidance.summary,
      sections: [
        { kind: 'lines', label: 'Usage', items: guidance.usage },
        { kind: 'pairs', label: 'Options', items: guidance.options },
        { kind: 'lines', label: 'Action', items: guidance.action },
      ],
    } as const;
  },

  async output(toolname?: string): Promise<string> {
    return Fmt.Help.build(await FmtActionHelp.input(toolname));
  },
} as const;
