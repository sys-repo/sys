import { describe, expect, it } from '../../-test.ts';
import { Markdown } from '../../m.Markdown/mod.ts';
import { Html } from '../mod.ts';
import { requireData, Sample } from './u.fixture.ts';

describe('Markdown.Html.render', () => {
  it('renders CommonMark Markdown source to HTML', () => {
    const html = requireData(Html.render(Sample.commonmarkDocument, { flavor: 'commonmark' }));

    expect(html).to.contain('<h1>Hello</h1>');
    expect(html).to.contain('<li>one</li>');
    expect(html).to.contain('<a href="https://example.com">example</a>');
  });

  it('renders GFM tables and task-list items by default', () => {
    const html = requireData(Html.render(Sample.gfmTableAndTaskList));

    expect(html).to.contain('<table>');
    expect(html).to.contain('<td>1</td>');
    expect(html).to.contain('done');
  });

  it('renders an existing MDAST root without reparsing source text', () => {
    const ast = requireData(Markdown.parse(Sample.commonmarkDocument, { flavor: 'commonmark' }));
    const html = requireData(Html.render(ast));

    expect(html).to.contain('<h1>Hello</h1>');
    expect(html).to.contain('<a href="https://example.com">example</a>');
  });
});
