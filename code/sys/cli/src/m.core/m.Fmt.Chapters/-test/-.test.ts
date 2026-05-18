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

  it('reads embedded text records from bundled resource data URIs', () => {
    const resources = Fmt.Chapters.Resources.create({
      json: {
        'root.yaml': 'data:text/plain;base64,aWQ6IHJvb3Q=',
        'binary.png': 'data:image/png;base64,AQID',
      },
      label: 'ExampleHelp',
      parse: (text, file) => ({ id: text.split(': ')[1], file }),
    });

    expect(resources.readText('root.yaml')).to.eql('id: root');
    expect(resources.readParsedRecord('root.yaml')).to.eql({ id: 'root', file: 'root.yaml' });
    expect(resources.readRecord('root.yaml', ['id'])).to.eql({ id: 'root', file: 'root.yaml' });
    expect(() => resources.readText('missing.yaml')).to.throw(
      'ExampleHelp: resource not found: missing.yaml',
    );
    expect(() => resources.readText('binary.png')).to.throw(
      'ExampleHelp: resource is not text: binary.png',
    );
    expect(() => resources.readRecord('root.yaml', ['title'])).to.throw(
      'ExampleHelp: missing field: title',
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
    expect(plain).to.contain('Chapter');
    expect(plain).to.contain('deno run jsr:@sys/example dsl short');
    expect(plain).to.contain('deno run jsr:@sys/example dsl longer-chapter');
    expect(plain).to.contain('# Short chapter.');
    expect(plain).to.contain('# Longer chapter.');
    expect(plain).to.not.contain('@sys/cell');

    expect(chapterCommentColumn(plain, 'short')).to.eql(
      chapterCommentColumn(plain, 'longer-chapter'),
    );
  });

  it('renders a custom child index label', () => {
    const text = Fmt.Chapters.format({ command, chapter, label: 'Topic' });
    const plain = Cli.stripAnsi(text);

    expect(plain).to.contain('Topic');
    expect(plain).to.contain('deno run jsr:@sys/example dsl short');
    expect(plain).to.not.contain('Chapter');
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
    expect(text).to.contain(
      '- `deno run jsr:@sys/example dsl longer-chapter --format skill` — Longer chapter.',
    );
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

function chapterCommentColumn(text: string, chapter: string): number {
  const line = text.split('\n').find((line) => line.includes(`dsl ${chapter}`));
  expect(line).to.not.eql(undefined);
  return line?.indexOf('#') ?? -1;
}
