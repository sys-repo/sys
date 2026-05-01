import { CliFmt, Str } from './common.ts';
import { Fmt } from './u.fmt.ts';

export const FmtRootHelp = {
  input(toolname = '@sys/cell/cli') {
    return {
      tool: toolname,
      summary: intro(),
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: [
            'deno run jsr:@sys/cell/cli --help',
            'deno run -RW jsr:@sys/cell/cli init [dir]',
            'deno run jsr:@sys/cell/cli help init',
            'deno run jsr:@sys/cell/cli help agent',
          ],
        },
        {
          kind: 'pairs',
          label: 'Commands',
          items: [
            ['init', `create the minimal ${Fmt.Cell()} folder contract`],
            ['help init', 'show init command help'],
            ['help agent', 'show expanded guidance for coding agents'],
          ],
        },
        {
          kind: 'pairs',
          label: 'Options',
          items: [
            ['-h, --help', 'show help'],
            ['--dry-run', 'preview init without writing files'],
          ],
        },
      ],
    } as const;
  },

  output(toolname?: string): string {
    return CliFmt.Help.build(FmtRootHelp.input(toolname));
  },
} as const;

/**
 * Helpers:
 */

function intro() {
  return Str.dedent(`
    A ${Fmt.Cell()} is a folder-shaped metamedium whose DSL stores
    meaning and whose meaning can be interpreted, viewed, and
    validly rewritten within the folder that bounds it.
  `);
}
