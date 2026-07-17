import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Markdown } from '../../m.Markdown/mod.ts';
import { Frontmatter } from '../mod.ts';

describe('Markdown.Frontmatter.surface', () => {
  it('is composed onto the package Markdown surface', () => {
    expect(Markdown.Frontmatter).to.equal(Frontmatter);
    expectTypeOf(Frontmatter).toEqualTypeOf<t.MarkdownFrontmatter.Lib>();
    expectTypeOf({} as t.Markdown.Frontmatter.Lib).toEqualTypeOf<t.MarkdownFrontmatter.Lib>();
  });
});
