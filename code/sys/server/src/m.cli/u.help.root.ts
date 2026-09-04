import { ServerHelp } from '../m.help/mod.ts';
import { c, Fmt } from './common.ts';

export const FmtRootHelp = Object.freeze(
  {
    async input(toolname = '@sys/server') {
      const guidance = await ServerHelp.Root.load();
      return {
        tool: toolname,
        summary: guidance.summary.replace('@sys/server', c.cyan('@sys/server')),
        sections: [
          { kind: 'lines', label: 'Usage', items: guidance.usage },
          { kind: 'pairs', label: 'Commands', items: guidance.commands },
          { kind: 'pairs', label: 'Options', items: guidance.options },
        ],
      } as const;
    },

    async output(toolname?: string): Promise<string> {
      return Fmt.Help.build(await FmtRootHelp.input(toolname));
    },
  } as const,
);
