import { CellHelp } from '../m.help/mod.ts';
import { Fmt } from './common.ts';

export const FmtMigrateHelp = {
  async input(toolname = '@sys/cell migrate') {
    const guidance = await CellHelp.Migrate.load();
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
    return Fmt.Help.build(await FmtMigrateHelp.input(toolname));
  },
} as const;
