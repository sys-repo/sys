import { CellHelp } from '../m.help/mod.ts';
import { Cli } from './common.ts';
import { composeHelpBlocks } from './u.help.compose.ts';

export type DslHelpInput = {
  readonly path?: readonly string[];
  readonly toolname?: string;
};

export const FmtDslHelp = {
  async output(input: DslHelpInput = {}): Promise<string> {
    const path = input.path ?? [];
    const chapter = await CellHelp.Dsl.load(path);
    const toolname = input.toolname ?? ['@sys/cell dsl', ...path].join(' ');
    const help = Cli.Fmt.Help.build({ tool: toolname, summary: chapter.summary });
    const table = Cli.Fmt.Chapters.format({
      command: 'deno run jsr:@sys/cell dsl',
      chapter,
      label: 'Chapter',
    });

    return table ? composeHelpBlocks(help, table) : help;
  },
} as const;
