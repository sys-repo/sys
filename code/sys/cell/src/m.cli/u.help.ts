import { c, CliFmt, Str } from './common.ts';
import { Tmpl } from './u.tmpl.ts';

const D = {
  tool: '@sys/cell/cli',
} as const;

export const FmtHelp = {
  input(toolname: string = D.tool) {
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
            'deno run jsr:@sys/cell/cli help agent',
          ],
        },
        {
          kind: 'pairs',
          label: 'Commands',
          items: [
            ['init', 'create the minimal Cell folder contract'],
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

  output(toolname: string = D.tool): string {
    return CliFmt.Help.build(FmtHelp.input(toolname));
  },

  async agentOutput(toolname: string = `${D.tool} help agent`): Promise<string> {
    const descriptor = await Tmpl.minimalDescriptor();
    const head = CliFmt.Help.build({ tool: toolname, summary: agentIntro(), sections: [] });
    const guide = table([
      [
        'Init',
        [
          'Run init when the folder is missing the Cell descriptor.',
          'Init is additive and owns only the minimal Cell contract.',
        ],
      ],
      ['Owns', ['data/', 'view/', '-config/@sys.cell/cell.yaml']],
      ['Safety', ['.gitignore may add .env once; never rewrite user rules.']],
      ['Preserve', ['.pi/', '-config/@sys.pi/', 'other tool-owned -config/* namespaces']],
      [
        'Rule',
        [
          'Cell owns topology; service config owns service details.',
          'Pull config owns materialization. Do not turn cell.yaml',
          'into a mega-config.',
        ],
      ],
    ]);

    return `${head}\n\n${guide}\n\n${yaml('Descriptor', descriptor)}`;
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

function agentIntro() {
  return Str.dedent(`
    Expanded guidance for coding agents editing a Cell folder.
    Keep changes additive, owner-correct, and in plain files.
  `);
}

type Row = readonly [label: string, lines: readonly string[]];

function table(rows: readonly Row[]) {
  const width = Math.max(...rows.map(([label]) => label.length));
  const lines: string[] = [];

  for (const [label, items] of rows) {
    items.forEach((item, index) => {
      const left = index === 0 ? c.gray(label.padEnd(width)) : ' '.repeat(width);
      lines.push(`${left}  ${c.white(item)}`);
    });
  }

  return lines.join('\n');
}

function yaml(label: string, text: string) {
  return [
    `${c.gray(label)}  ${c.white('YAML')}`,
    c.gray('  ```yaml'),
    ...block(text).map((line) => c.gray(`  ${line}`)),
    c.gray('  ```'),
  ].join('\n');
}

function block(text: string): readonly string[] {
  return Str.trimEdgeNewlines(text).split('\n');
}
