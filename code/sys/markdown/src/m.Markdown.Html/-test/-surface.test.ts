import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Markdown } from '../../m.Markdown/mod.ts';
import { Html } from '../mod.ts';

describe('m.Markdown.Html/surface', () => {
  it('is composed onto the package Markdown surface', () => {
    expect(Markdown.Html).to.equal(Html);
    expectTypeOf(Html).toEqualTypeOf<t.MarkdownHtml.Lib>();
    expectTypeOf({} as t.Markdown.Html.Lib).toEqualTypeOf<t.MarkdownHtml.Lib>();
  });
});
