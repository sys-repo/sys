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

  it('rejects malformed semantic node shapes', () => {
    expect(MarkdownIs.heading({ type: 'heading', depth: 7, children: [] })).to.eql(false);
    expect(MarkdownIs.inlineCode({ type: 'inlineCode', value: 42 })).to.eql(false);
    expect(MarkdownIs.link({ type: 'link', url: '/safe', title: 42, children: [] })).to.eql(false);
    expect(MarkdownIs.taskListItem({ type: 'listItem', checked: null, children: [] })).to.eql(
      false,
    );
    expect(MarkdownIs.thematicBreak({ type: 'paragraph', children: [] })).to.eql(false);
  });
});
