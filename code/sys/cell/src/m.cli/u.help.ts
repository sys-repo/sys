import { CliFmt, Str } from './common.ts';
import { Tmpl } from './u.tmpl.ts';

const D = {
  tool: '@sys/cell/cli',
} as const;

export const FmtHelp = {
  async input(toolname: string = D.tool) {
    const descriptor = await Tmpl.minimalDescriptor();
    return {
      tool: toolname,
      summary:
        'A @sys/cell is a plain-folder metamedium unit: meaning, views, and services behind a small inspectable contract.',
      note: 'Source-backed help only; this command does not write files or scaffold a Cell.',
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: [
            'deno task cli --help',
            'deno run jsr:@sys/cell/cli --help',
          ],
        },
        {
          kind: 'pairs',
          label: 'Options',
          items: [['-h, --help', 'show help']],
        },
        {
          kind: 'lines',
          label: 'Folder',
          items: ['data/', 'view/', '-config/@sys.cell/cell.yaml'],
        },
        {
          kind: 'lines',
          label: 'Minimal descriptor',
          items: block(descriptor),
          tone: 'muted',
        },
      ],
    } as const;
  },

  async output(toolname: string = D.tool): Promise<string> {
    return CliFmt.Help.build(await FmtHelp.input(toolname));
  },
} as const;

/**
 * Helpers:
 */

function block(text: string): readonly string[] {
  return Str.trimEdgeNewlines(text).split('\n');
}
