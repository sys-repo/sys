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

function chapterCommentColumn(text: string, chapter: string): number {
  const line = text.split('\n').find((line) => line.includes(`dsl ${chapter}`));
  expect(line).to.not.eql(undefined);
  return line?.indexOf('#') ?? -1;
}
