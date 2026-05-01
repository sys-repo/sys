import { CliFmt, Str } from './common.ts';
import { Fmt } from './u.fmt.ts';

export const FmtInitHelp = {
  input(toolname = '@sys/cell/cli init') {
    return {
      tool: toolname,
      summary: intro(),
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: [
            'deno run -RW jsr:@sys/cell init [dir]',
            'deno run -RW jsr:@sys/cell/cli init [dir]',
          ],
        },
        {
          kind: 'pairs',
          label: 'Options',
          items: [
            ['-h, --help', 'show init help'],
            ['--dry-run', 'preview writes without changing files'],
          ],
        },
      ],
    } as const;
  },

  output(toolname?: string): string {
    const input = FmtInitHelp.input(toolname);
    return CliFmt.Help.build({
      ...input,
      sections: [
        ...input.sections,
        {
          kind: 'lines',
          label: 'Safety',
          items: [
            `additive; validates existing ${Fmt.Cell()} descriptors before writing`,
            'use --dry-run to preview exact file operations',
            `.gitignore may add ${Fmt.env()} once`,
            'leaves .pi/ and other tool-owned -config/* namespaces untouched',
          ],
        },
      ],
    });
  },
} as const;

/**
 * Helpers:
 */

function intro() {
  return Str.dedent(`
    Create the minimal ${Fmt.Cell()} folder contract in the target directory.
    Init creates the descriptor, stored-meaning lane, view lane, and
    local ignore for ${Fmt.env()}.
  `);
}
