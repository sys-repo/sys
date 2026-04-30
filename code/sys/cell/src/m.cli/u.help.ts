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
      summary: intro(),
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

function intro() {
  return Str.dedent(`
    A Cell is a folder-shaped metamedium whose DSL stores
    meaning and whose meaning can be interpreted, viewed, and
    validly rewritten within the folder that bounds it.
  `);
}

function block(text: string): readonly string[] {
  return Str.trimEdgeNewlines(text).split('\n');
}
