import { CellHelp } from '../../m.help/mod.ts';
import { Fmt } from '../common.ts';

export const FmtTaskHelp = Object.freeze(
  {
    async input(toolname = '@sys/cell task') {
      const guidance = await CellHelp.Task.load();
      return {
        tool: toolname,
        summary: guidance.summary,
        sections: [
          { kind: 'lines', label: 'Usage', items: guidance.usage },
          { kind: 'pairs', label: 'Options', items: guidance.options },
          { kind: 'lines', label: 'Task', items: guidance.task },
        ],
      } as const;
    },

    async output(toolname?: string): Promise<string> {
      return Fmt.Help.build(await FmtTaskHelp.input(toolname));
    },
  } as const,
);
