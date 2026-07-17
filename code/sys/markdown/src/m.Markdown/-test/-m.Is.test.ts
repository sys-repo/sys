import { describe, expect, expectTypeOf, it } from '../../-test.ts';
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
});
