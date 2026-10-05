import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fmt } from '../../mod.ts';

const command = 'deno run jsr:@sys/example dsl';

const chapter = {
  id: 'dsl',
  path: [],
  title: 'Example DSL',
  summary: 'Example DSL root.',
  sections: [
    { label: 'Rule', items: ['Start from public help.', 'Use owner flows.'] },
    { label: 'Mappings', items: ['add thing → run owner add'] },
  ],
  chapters: [
    { id: 'short', path: ['short'], title: 'Short', summary: 'Short chapter.' },
    {
      id: 'longer-chapter',
      path: ['longer-chapter'],
      title: 'Longer chapter',
      summary: 'Longer chapter.',
    },
  ],
} as const;

describe('Cli.Fmt.Chapters', () => {
  it('API', async () => {
    const m = await import('@sys/cli/fmt');

    expect(Fmt.Chapters).to.equal(Cli.Fmt.Chapters);
    expect(m.Fmt.Chapters).to.equal(Fmt.Chapters);
    expect(m.Chapters).to.equal(Fmt.Chapters);
  });

  it('resolves chapter resources by nested path', () => {
    const root = {
      id: 'root',
      file: 'root.yaml',
      children: [
        {
          id: 'child',
          file: 'child.yaml',
          children: [{ id: 'leaf', file: 'leaf.yaml', children: [] }],
        },
      ],
    } as const;

    expect(Fmt.Chapters.files(root)).to.eql(['root.yaml', 'child.yaml', 'leaf.yaml']);
    expect(Fmt.Chapters.resolve(root, [])?.id).to.eql('root');
    expect(Fmt.Chapters.resolve(root, ['child'])?.file).to.eql('child.yaml');
    expect(Fmt.Chapters.resolve(root, ['child', 'leaf'])?.file).to.eql('leaf.yaml');
    expect(Fmt.Chapters.resolve(root, ['missing'])).to.eql(undefined);
    expect(Fmt.Chapters.resolve(root, ['child', 'missing'])).to.eql(undefined);
  });

  it('loads authored chapter-book records by nested path', async () => {
    const root = {
      id: 'root',
      file: 'root.yaml',
      children: [
        {
          id: 'child',
          file: 'child.yaml',
          children: [{ id: 'leaf', file: 'leaf.yaml', children: [] }],
        },
      ],
    } as const;
    const records: Record<string, unknown> = {
      'root.yaml': {
        id: 'root',
        title: 'Root chapter',
        summary: 'Root summary.',
        sections: [{ label: 'Rule', items: 'Line one.\nLine two.' }],
      },
      'child.yaml': {
        id: 'child',
        title: 'Child chapter',
        summary: 'Child summary.',
        sections: [{ label: 'Owner flow', items: ['Run owner command.'] }],
      },
      'leaf.yaml': {
        id: 'leaf',
        title: 'Leaf chapter',
        summary: 'Leaf summary.',
        sections: [{ label: 'Verify', items: ['Run targeted test.'] }],
      },
    };
    const book = Fmt.Chapters.Book.create({
      root,
      label: 'ExampleHelp',
      noun: 'DSL chapter',
      recordKind: 'YAML record',
      read: (file) => records[file],
    });

    expect(book.root).to.equal(root);
    expect(book.files()).to.eql(['root.yaml', 'child.yaml', 'leaf.yaml']);
    expect(book.resolve(['child', 'leaf'])?.file).to.eql('leaf.yaml');

    const loadedRoot = await book.load();
    expect(loadedRoot.id).to.eql('root');
    expect(loadedRoot.sections).to.eql([
      { label: 'Rule', items: ['Line one.', 'Line two.'] },
    ]);
    expect(loadedRoot.chapters).to.eql([
      {
        id: 'child',
        path: ['child'],
        title: 'Child chapter',
        summary: 'Child summary.',
      },
    ]);

    const leaf = await book.load(['child', 'leaf']);
    expect(leaf.path).to.eql(['child', 'leaf']);
    expect(leaf.chapters).to.eql([]);
  });

  it('chapter-book loader fails clearly for missing paths and invalid records', async () => {
    const root = { id: 'root', file: 'root.yaml', children: [] } as const;
    const records: Record<string, unknown> = {
      'root.yaml': { id: 'wrong' },
    };
    const book = Fmt.Chapters.Book.create({
      root,
      label: 'ExampleHelp',
      noun: 'DSL chapter',
      recordKind: 'YAML record',
      read: (file) => records[file],
    });

    await expectFailure(
      () => book.load(['missing']),
      'ExampleHelp: DSL chapter not found: missing',
    );
    await expectFailure(() => book.load(), 'ExampleHelp: missing field: title');
  });

  it('reads embedded text records through canonical data-URI media types', () => {
    const resources = Fmt.Chapters.Resources.create({
      json: {
        'root.yaml': 'data:text/plain;base64,aWQ6IHJvb3Q=',
        'default.yaml': 'data:;base64,aWQ6IHJvb3Q=',
        'parameterized.txt': 'data:text/plain;charset=UTF-8;base64,aGVsbG8=',
        'structured.json': 'data:application/vnd.api+JSON;version=1;base64,eyJpZCI6InJvb3QifQ==',
      },
      label: 'ExampleHelp',
      parse: (text, file) => ({ id: text.split(': ')[1], file }),
    });

    expect(resources.readText('root.yaml')).to.eql('id: root');
    expect(resources.readText('default.yaml')).to.eql('id: root');
    expect(resources.readText('parameterized.txt')).to.eql('hello');
    expect(resources.readText('structured.json')).to.eql('{"id":"root"}');
    expect(resources.readParsedRecord('root.yaml')).to.eql({ id: 'root', file: 'root.yaml' });
    expect(resources.readRecord('root.yaml', ['id'])).to.eql({ id: 'root', file: 'root.yaml' });
    expect(() => resources.readText('missing.yaml')).to.throw(
      'ExampleHelp: resource not found: missing.yaml',
    );
    expect(() => resources.readRecord('root.yaml', ['title'])).to.throw(
      'ExampleHelp: missing field: title',
    );
  });

  it('rejects non-base64, malformed, and binary resource data URIs', () => {
    const resources = Fmt.Chapters.Resources.create({
      json: {
        'plain.txt': 'data:text/plain,hello',
        'malformed.txt': 'data:text/plain;broken;base64,aGVsbG8=',
        'binary.png': 'data:image/png;base64,AQID',
      },
      label: 'ExampleHelp',
      parse: (text) => text,
    });

    expect(() => resources.readText('plain.txt')).to.throw(
      'ExampleHelp: resource is not text: plain.txt',
    );
    expect(() => resources.readText('malformed.txt')).to.throw(
      'ExampleHelp: resource is not text: malformed.txt',
    );
    expect(() => resources.readText('binary.png')).to.throw(
      'ExampleHelp: resource is not text: binary.png',
    );
  });

  it('renders sections and a parameterized child chapter index', () => {
    const text = Fmt.Chapters.format({ command, chapter });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.contain('Rule');
    expect(plain).to.contain('Start from public help.');
    expect(plain).to.contain('Use owner flows.');
    expect(plain).to.contain('Mappings');
    expect(plain).to.contain('add thing → run owner add');
    expect(plain).to.contain('Chapters');
    expect(plain).to.contain('deno run jsr:@sys/example dsl short');
    expect(plain).to.contain('deno run jsr:@sys/example dsl longer-chapter');
    expect(plain).to.contain('Short chapter.');
    expect(plain).to.contain('Longer chapter.');
    expect(plain).to.not.contain('@sys/cell');
    expect(lineColumn(plain, 'Start from public help.')).to.eql(
      lineColumn(plain, 'Use owner flows.'),
    );

    expect(chapterSummaryColumn(plain, 'short', 'Short chapter.')).to.eql(
      chapterSummaryColumn(plain, 'longer-chapter', 'Longer chapter.'),
    );
  });

  it('pluralizes the default child index label', () => {
    const single = {
      ...chapter,
      chapters: [chapter.chapters[0]],
    } as const;

    expect(Cli.stripAnsi(Fmt.Chapters.format({ command, chapter }))).to.contain('Chapters');
    expect(Cli.stripAnsi(Fmt.Chapters.format({ command, chapter: single }))).to.contain('Chapter');
    expect(Cli.stripAnsi(Fmt.Chapters.format({ command, chapter: single }))).to.not.contain(
      'Chapters',
    );
  });

  it('renders a custom child index label', () => {
    const text = Fmt.Chapters.format({ command, chapter, label: 'Topic' });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.contain('Topic');
    expect(plain).to.contain('deno run jsr:@sys/example dsl short');
    expect(plain).to.not.contain('Chapter');
  });

  it('wraps long terminal section items within the chapter text width', () => {
    const long = {
      ...chapter,
      sections: [
        {
          label: 'Runtime authority',
          items: [
            'The `@sys/cell` package version that provides the DSL must match the runtime version that loads, verifies, runs tasks for, or starts the Cell.',
          ],
        },
      ],
      chapters: [],
    } as const;
    const text = Fmt.Chapters.format({ command, chapter: long });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.contain('Runtime authority');
    expect(plain).to.contain('must');
    expect(plain).to.contain('match');
    expect(plain).to.contain('runtime version');
    expect(plain).to.contain('or starts the Cell.');
    expect(lineColumn(plain, 'or starts the Cell.')).to.be.greaterThan(0);
    expectMaxVisibleWidth(plain, 128);
  });

  it('fits terminal section prose within an explicit physical width', () => {
    const long = {
      ...chapter,
      sections: [
        {
          label: 'Runtime authority',
          items: [
            'The package version that provides the DSL must match the runtime version that loads, verifies, runs tasks for, or starts the Cell.',
          ],
        },
      ],
      chapters: [],
    } as const;
    const text = Fmt.Chapters.format({ command, chapter: long, layout: { width: 80 } });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.contain('Runtime authority');
    expect(plain).to.contain('loads, verifies');
    expectMaxVisibleWidth(plain, 80);
  });

  it('uses stacked labels when the physical width leaves too little body space', () => {
    const narrow = {
      ...chapter,
      sections: [
        {
          label: 'Runtime authority',
          items: ['Read the matching chapter before editing the Cell folder.'],
        },
      ],
      chapters: [],
    } as const;
    const text = Fmt.Chapters.format({ command, chapter: narrow, layout: { width: 40 } });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.contain('Runtime authority\n  Read the matching');
    expectMaxVisibleWidth(plain, 40);
  });

  it('indents explicit section item continuations', () => {
    const wrapped = {
      ...chapter,
      sections: [
        {
          label: 'Reading protocol',
          items: ['Read the matching chapter before editing.\nThen make the narrow change.'],
        },
      ],
      chapters: [],
    } as const;
    const text = Fmt.Chapters.format({ command, chapter: wrapped });
    const plain = Cli.stripAnsi(text);

    expect(lineColumn(plain, 'Then make the narrow change.')).to.eql(
      lineColumn(plain, 'Read the matching chapter before editing.') + 2,
    );
  });

  it('preserves fenced section item lines while indenting the block as a continuation', () => {
    const fenced = {
      ...chapter,
      sections: [
        {
          label: 'Diagnostics',
          items: [
            'If `Cell.load` reports this failure family:\n```text\n/dsl: Expected required property\n/services: Unexpected property\n```\ntreat it as runtime/schema drift.',
          ],
        },
      ],
      chapters: [],
    } as const;
    const text = Fmt.Chapters.format({ command, chapter: fenced });
    const plain = Cli.stripAnsi(text);
    const start = lineColumn(plain, 'If `Cell.load` reports this failure family:');

    expect(lineColumn(plain, '```text')).to.eql(start + 2);
    expect(lineColumn(plain, '/dsl: Expected required property')).to.eql(start + 2);
    expect(lineColumn(plain, '/services: Unexpected property')).to.eql(start + 2);
    expect(lineColumn(plain, 'treat it as runtime/schema drift.')).to.eql(start + 2);
  });

  it('keeps whole-line command continuations atomic', () => {
    const commandLine =
      '`deno run -ERW jsr:@sys/tmpl --non-interactive --dir <target-dir> <template> [template-flags]`.';
    const atomic = {
      ...chapter,
      sections: [
        {
          label: 'Usage',
          items: [`Run this exact command:\n${commandLine}`],
        },
      ],
      chapters: [],
    } as const;
    const text = Fmt.Chapters.format({ command, chapter: atomic });
    const plain = Cli.stripAnsi(text);

    expect(lineContaining(plain, commandLine)).to.contain(commandLine);
    expect(lineColumn(plain, commandLine)).to.eql(
      lineColumn(plain, 'Run this exact command:') + 2,
    );
  });

  it('wraps long Markdown section items within the Markdown width', () => {
    const long = {
      ...chapter,
      sections: [
        {
          label: 'Concept',
          items: [
            'Delta is the package-change view between a baseline and the current workspace, and bump planning consumes those roots without applying package edits.',
          ],
        },
      ],
      chapters: [],
    } as const;
    const text = Fmt.Chapters.markdown({ command, chapter: long });

    expect(text).to.contain('Delta is the package-change view');
    expect(text).to.contain('without applying package edits.');
    expectMaxVisibleWidth(text, 80);
  });

  it('wraps long child chapter index rows within the chapter text width', () => {
    const long = {
      ...chapter,
      sections: [{ label: 'Reading protocol', items: ['Read root.'] }],
      chapters: [
        {
          id: 'delta',
          path: ['delta'],
          title: 'Delta',
          summary:
            'Map git changes to bump roots and explain why each affected package participates in the release closure.',
        },
      ],
    } as const;
    const text = Fmt.Chapters.format({
      command: 'deno run -ER jsr:@sys/workspace dsl',
      chapter: long,
    });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.contain('deno run -ER jsr:@sys/workspace dsl delta');
    expect(plain).to.contain('Map git changes to bump roots');
    expect(lineColumn(plain, 'Map git changes to bump roots')).to.eql(
      lineColumn(plain, 'deno run -ER jsr:@sys/workspace dsl delta') + 2,
    );
    expectMaxVisibleWidth(plain, 128);
  });

  it('uses the double-line child chapter index form for all rows when any row does not fit inline', () => {
    const mixed = {
      ...chapter,
      sections: [],
      chapters: [
        {
          id: 'short',
          path: ['short'],
          title: 'Short',
          summary: 'Short summary.',
        },
        {
          id: 'static-serve-service',
          path: ['static-serve-service'],
          title: 'Static serve service',
          summary:
            'Add a static-file service backed by an `@sys/tools/serve` owner config that must wrap under narrow chapter indexes.',
        },
      ],
    } as const;
    const text = Fmt.Chapters.format({
      command: 'deno run -ER jsr:@sys/cell dsl',
      chapter: mixed,
      layout: { width: 104 },
    });
    const plain = Cli.stripAnsi(text);
    const shortCommand = 'deno run -ER jsr:@sys/cell dsl short';
    const longCommand = 'deno run -ER jsr:@sys/cell dsl static-serve-service';

    expect(lineContaining(plain, shortCommand)).to.not.contain('Short summary.');
    expect(lineColumn(plain, 'Short summary.')).to.eql(lineColumn(plain, shortCommand) + 2);
    expect(lineContaining(plain, longCommand)).to.not.contain('Add a static-file service');
    expect(lineColumn(plain, 'Add a static-file service')).to.eql(
      lineColumn(plain, longCommand) + 2,
    );
    expectMaxVisibleWidth(plain, 104);
  });

  it('fits child chapter index rows within an explicit physical width', () => {
    const long = {
      ...chapter,
      sections: [{ label: 'Reading protocol', items: ['Read root.'] }],
      chapters: [
        {
          id: 'delta',
          path: ['delta'],
          title: 'Delta',
          summary:
            'Map git changes to bump roots and explain why each affected package participates in the release closure.',
        },
      ],
    } as const;
    const text = Fmt.Chapters.format({
      command: 'deno run -ER jsr:@sys/workspace dsl',
      chapter: long,
      layout: { width: 80 },
    });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.contain('deno run -ER jsr:@sys/workspace dsl delta');
    expect(plain).to.contain('Map git changes to bump roots');
    expectMaxVisibleWidth(plain, 80);
  });

  it('renders a full terminal chapter help page', () => {
    const text = Fmt.Chapters.page({
      command,
      chapter,
      help: {
        tool: '@sys/example dsl',
        summary: 'Example chapter help.',
        sections: [
          { kind: 'lines', label: 'Usage', items: [`${command} [chapter...]`] },
          { kind: 'pairs', label: 'Options', items: [['--format <format>', 'render output']] },
        ],
      },
    });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.contain('@sys/example dsl');
    expect(plain).to.contain('Example chapter help.');
    expect(plain).to.contain('Usage');
    expect(plain).to.contain(`${command} [chapter...]`);
    expect(plain).to.contain('--format <format>');
    expect(plain).to.contain('━'.repeat(8));
    expect(plain).to.contain('Rule');
    expect(plain).to.contain('Chapter');
    expect(plain.indexOf('--format <format>')).to.be.lessThan(plain.indexOf('Rule'));
    expect(plain.indexOf('━'.repeat(8))).to.be.lessThan(plain.indexOf('Rule'));
    expect(plain).to.not.contain('@sys/cell');
  });

  it('fits page separators within an explicit physical width', () => {
    const text = Fmt.Chapters.page({
      command,
      chapter: { ...chapter, chapters: [] },
      layout: { width: 40 },
      help: {
        tool: '@sys/example dsl',
        summary: 'Example chapter help.',
      },
    });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.contain('━'.repeat(40));
    expectMaxVisibleWidth(plain, 40);
  });

  it('renders a full terminal chapter help page without a separator', () => {
    const text = Fmt.Chapters.page({
      command,
      chapter,
      separator: false,
      help: { tool: '@sys/example dsl', summary: 'Example chapter help.' },
    });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.contain('@sys/example dsl');
    expect(plain).to.contain('Rule');
    expect(plain).to.not.contain('━'.repeat(8));
  });

  it('omits the separator when a full terminal chapter help page has no chapter body', () => {
    const text = Fmt.Chapters.page({
      command,
      chapter: { ...chapter, sections: [], chapters: [] },
      help: { tool: '@sys/example dsl', summary: 'Example chapter help.' },
    });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.contain('@sys/example dsl');
    expect(plain).to.contain('Example chapter help.');
    expect(plain).to.not.contain('Rule');
    expect(plain).to.not.contain('Chapter');
    expect(plain).to.not.contain('━'.repeat(8));
  });

  it('renders Markdown with frontmatter, sections, and child chapter links', () => {
    const text = Fmt.Chapters.markdown({
      command,
      commandSuffix: '--format skill',
      chapter,
      frontmatter: {
        name: 'example-dsl',
        description: 'Example skill projection.',
      },
    });

    expect(text).to.eql(Cli.stripAnsi(text));
    expect(text).to.contain(
      '---\nname: "example-dsl"\ndescription: "Example skill projection."\n---',
    );
    expect(text).to.contain('# Example DSL');
    expect(text).to.contain('Example DSL root.');
    expect(text).to.contain('## Rule');
    expect(text).to.contain('Start from public help.');
    expect(text).to.contain('## Mappings');
    expect(text).to.contain('add thing → run owner add');
    expect(text).to.contain('## Chapters');
    expect(text).to.contain(
      '- `deno run jsr:@sys/example dsl short --format skill` — Short chapter.',
    );
    expect(text).to.contain('deno run jsr:@sys/example dsl longer-chapter --format skill');
    expect(text).to.contain('Longer chapter.');
    expectMaxVisibleWidth(text, 80);
    expect(text).to.not.contain('@sys/cell');
  });

  it('escapes YAML frontmatter scalar strings in Markdown output', () => {
    const text = Fmt.Chapters.markdown({
      command,
      chapter: { ...chapter, chapters: [] },
      frontmatter: {
        name: 'quote-test',
        description: 'A "quoted" path C:\\tmp over\ntwo lines.',
      },
    });

    expect(text).to.contain('name: "quote-test"');
    expect(text).to.contain('description: "A \\"quoted\\" path C:\\\\tmp over\\ntwo lines."');
  });

  it('omits the child chapter index for leaf chapters', () => {
    const text = Fmt.Chapters.format({
      command,
      chapter: { ...chapter, chapters: [] },
    });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.contain('Rule');
    expect(plain).to.contain('Mappings');
    expect(plain).to.not.contain('Chapter');
    expect(plain).to.not.contain(`${command} short`);
  });
});

async function expectFailure(fn: () => Promise<unknown>, message: string) {
  let error: unknown;
  try {
    await fn();
  } catch (err) {
    error = err;
  }

  expect(error).to.be.instanceOf(Error);
  if (error instanceof Error) expect(error.message).to.eql(message);
}

function chapterSummaryColumn(text: string, chapter: string, summary: string): number {
  const line = text.split('\n').find((line) => line.includes(`dsl ${chapter}`));
  expect(line).to.not.eql(undefined);
  return line?.indexOf(summary) ?? -1;
}

function lineColumn(text: string, needle: string): number {
  const line = lineContaining(text, needle);
  return line.indexOf(needle);
}

function lineContaining(text: string, needle: string): string {
  const line = text.split('\n').find((line) => line.includes(needle));
  expect(line).to.not.eql(undefined);
  return line ?? '';
}

function expectMaxVisibleWidth(text: string, width: number) {
  const wide = Cli.stripAnsi(text)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > width);
  expect(wide, wide.join('\n')).to.eql([]);
}
