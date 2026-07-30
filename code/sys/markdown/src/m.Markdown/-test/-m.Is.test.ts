import { describe, expect, expectTypeOf, it, Str } from '../../-test.ts';
import { Markdown } from '../mod.ts';
import { MarkdownIs } from '../m.Is.ts';
import { requireData } from './u.fixture.ts';

describe('Markdown.Is', () => {
  it('composes the package Markdown.Is surface', () => {
    expect(Markdown.Is).to.equal(MarkdownIs);
    expectTypeOf(MarkdownIs).toEqualTypeOf<typeof Markdown.Is>();
  });

  it('recognizes canonical MDAST root nodes', () => {
    const ast = requireData(Markdown.parse(''));

    expect(MarkdownIs.ast(ast)).to.eql(true);
    expect(MarkdownIs.ast({ type: 'paragraph', children: [] })).to.eql(false);
  });

  it('recognizes semantic nodes produced by the canonical parser', () => {
    const source = Str.dedent(`
      # Heading

      ---

      \`token\` and [link](https://example.com).

      - [x] task
    `);
    const ast = requireData(Markdown.parse(source));
    const [heading, thematicBreak, paragraph, list] = ast.children;
    const inlineCode = paragraph?.type === 'paragraph' ? paragraph.children[0] : undefined;
    const link = paragraph?.type === 'paragraph' ? paragraph.children[2] : undefined;
    const taskListItem = list?.type === 'list' ? list.children[0] : undefined;

    expect(MarkdownIs.heading(heading)).to.eql(true);
    expect(MarkdownIs.inlineCode(inlineCode)).to.eql(true);
    expect(MarkdownIs.link(link)).to.eql(true);
    expect(MarkdownIs.taskListItem(taskListItem)).to.eql(true);
    expect(MarkdownIs.thematicBreak(thematicBreak)).to.eql(true);
  });

  it('recognizes code blocks parsed from backtick and tilde fences', () => {
    const sources = [
      Str.dedent(`
        \`\`\`ts title="backtick"
        const answer: number = 42;
        \`\`\`
      `),
      Str.dedent(`
        ~~~ts title="tilde"
        const answer: number = 42;
        ~~~
      `),
    ];

    for (const source of sources) {
      const ast = requireData(Markdown.parse(source));
      expect(ast.children).to.have.length(1);
      expect(MarkdownIs.code(ast.children[0])).to.eql(true);
    }
  });

  it('recognizes optional code-block language and metadata', () => {
    expect(MarkdownIs.code({ type: 'code', value: 'plain' })).to.eql(true);
    expect(MarkdownIs.code({ type: 'code', value: 'plain', lang: null, meta: null })).to.eql(true);
    expect(
      MarkdownIs.code({
        type: 'code',
        value: 'const value = 1;',
        lang: 'ts',
        meta: 'title=sample',
      }),
    ).to.eql(true);
  });

  it('rejects malformed semantic node shapes', () => {
    expect(MarkdownIs.code({ type: 'inlineCode', value: 'plain' })).to.eql(false);
    expect(MarkdownIs.code({ type: 'code', value: 42 })).to.eql(false);
    expect(MarkdownIs.code({ type: 'code', value: 'plain', lang: 42 })).to.eql(false);
    expect(MarkdownIs.code({ type: 'code', value: 'plain', meta: false })).to.eql(false);
    expect(MarkdownIs.heading({ type: 'heading', depth: 7, children: [] })).to.eql(false);
    expect(MarkdownIs.inlineCode({ type: 'inlineCode', value: 42 })).to.eql(false);
    expect(MarkdownIs.link({ type: 'link', url: '/safe', title: 42, children: [] })).to.eql(false);
    expect(MarkdownIs.taskListItem({ type: 'listItem', checked: null, children: [] })).to.eql(
      false,
    );
    expect(MarkdownIs.thematicBreak({ type: 'paragraph', children: [] })).to.eql(false);
  });
});
